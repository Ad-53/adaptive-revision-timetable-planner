/**
 * RevisionAI - Core Application Logic
 * 
 * This file manages the front-end experience for the adaptive revision timetable.
 * It includes authentication state, exam schedule updates, topic management, calendar
 * rendering, flowchart upload support, revision question flow, and API integration.
 */

// Default backend API URL for this project.
const API_BASE_URL = window.API_BASE_URL || '';

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function getToastIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Loading overlay system
function showLoading(text = 'Processing...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    if (overlay && loadingText) {
        overlay.classList.remove('hidden');
        loadingText.textContent = text;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

    const app = {
        // --- Persistent application state ---
        state: {
            isAuthenticated: false,
            authMode: 'login',
            currentView: 'auth',
            token: null,
            user: null,
            examData: {
                subject: '',
                board: 'AQA',
                date: '',
                topics: []
            },
            revisionQueue: [],
            currentQuestion: null,
            questionsAnswered: 0,
            totalConfidence: 0,
            // Quiz mode state
            quizMode: {
                enabled: false,
                questionQueue: [],
                currentQuizQuestion: null,
                quizScore: 0,
                quizTotalQuestions: 0,
                questionsAnsweredInQuiz: 0,
                currentPackId: null,
                savedPacks: [],
                packDraft: {
                    name: '',
                    folder: '',
                    questions: []
                }
            }
        },

    // --- Initialization ---
    async init() {
        this.loadStoredState();
        this.prepareDemoState();
        await this.loadAuthState();
        await this.loadServerState();
        this.setupEventListeners();
        this.setupQuizEventListeners();
        this.initTheme();
        this.initMermaid();

        if (this.state.isAuthenticated) {
            this.setUserGreeting();
            this.showView('dashboard');
            this.updateExamSummary();
        } else {
            window.location.href = '/frontend/login.html';
            return;
        }
        console.log('RevisionAI initialized');
    },

    async loadAuthState() {
        if (typeof supabaseClient === 'undefined') {
            this.state.isAuthenticated = false;
            return;
        }

        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.warn('Supabase session check failed:', error.message || error);
            this.state.isAuthenticated = false;
            return;
        }

        if (session?.user) {
            this.state.isAuthenticated = true;
            this.state.token = session.access_token;
            this.state.user = session.user;
        } else {
            this.state.isAuthenticated = false;
        }
    },

    async loadServerState() {
        if (!this.state.isAuthenticated) return;

        try {
            const examResponse = await this.apiRequest('GET', '/exam');
            if (examResponse?.exam) {
                this.state.examData = {
                    subject: examResponse.exam.subject || this.state.examData.subject,
                    board: examResponse.exam.board || this.state.examData.board,
                    date: examResponse.exam.date || this.state.examData.date,
                    topics: examResponse.exam.topics || this.state.examData.topics,
                };
            }

            const planResponse = await this.apiRequest('GET', '/revision-plan');
            if (planResponse?.revisionQueue) {
                this.state.revisionQueue = planResponse.revisionQueue;
            }
        } catch (error) {
            console.warn('Unable to load server state:', error);
        }
    },

    // Load saved application state from localStorage
    loadStoredState() {
        try {
            const savedState = localStorage.getItem('revisionAIState');
            if (!savedState) return;
            const parsed = JSON.parse(savedState);
            this.state = {
                ...this.state,
                ...parsed,
                examData: {
                    ...this.state.examData,
                    ...(parsed.examData || {})
                },
                quizMode: {
                    ...this.state.quizMode,
                    ...(parsed.quizMode || {})
                }
            };
            if (this.state.isAuthenticated) {
                this.setUserGreeting();
            }
        } catch (error) {
            console.warn('Unable to load saved state:', error);
        }
    },

    prepareDemoState() {
        if (this.state.examData.date || this.state.examData.topics.length || this.state.revisionQueue.length || this.state.questionsAnswered) {
            return;
        }

        const today = new Date();
        const examDate = new Date(today);
        examDate.setDate(today.getDate() + 21);
        const examDateString = examDate.toISOString().slice(0, 10);

        const topics = [
            'Algorithms',
            'Data Structures',
            'Networks',
            'Databases',
            'Software Engineering',
            'Artificial Intelligence'
        ];

        const baseQuestions = [
            'Explain the difference between a stack and a queue and give one example of each.',
            'Describe how binary search works and why it is efficient for sorted data.',
            'Explain the main layers of the OSI model and a key responsibility of each.',
            'Describe how a relational database uses primary keys and foreign keys.',
            'Summarise agile development principles and why they improve team delivery.',
            'Explain the difference between supervised and unsupervised learning in AI.'
        ];

        const reviewSessions = topics.map((topic, index) => ({
            id: `demo_rev_${index}`,
            topic_name: topic,
            question: baseQuestions[index],
            confidence: this.getRandomConfidence(4, 9),
            scheduledAt: new Date(today.getTime() + (index * 2 + 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            lastFeedback: 'Reviewed with AI and confidence adjusted.',
            ai_score_awarded: Math.floor(Math.random() * 3) + 2,
            ai_max_score: 4
        }));

        const currentQuestion = reviewSessions.shift();
        const totalConfidence = reviewSessions.reduce((sum, item) => sum + item.confidence, currentQuestion.confidence);

        this.state.examData = {
            subject: 'Computer Science',
            board: 'AQA',
            date: examDateString,
            topics: topics
        };
        this.state.revisionQueue = reviewSessions;
        this.state.currentQuestion = currentQuestion;
        this.state.questionsAnswered = 18;
        this.state.totalConfidence = totalConfidence;

        this.state.quizMode = {
            ...this.state.quizMode,
            enabled: true,
            questionQueue: [
                {
                    id: 'demo_quiz_2',
                    question_id: 'quiz_2',
                    topic_name: 'Databases',
                    question_text: 'Describe normalization and why it is important in database design.',
                    marks: 4,
                    max_score: 4,
                    user_answer: 'Normalization reduces redundancy and improves consistency.',
                    ai_score_awarded: 3,
                    ai_feedback: 'Good explanation; include a concrete example next time.',
                    user_confidence_rating: 7
                },
                {
                    id: 'demo_quiz_3',
                    question_id: 'quiz_3',
                    topic_name: 'Software Engineering',
                    question_text: 'Explain the role of version control in team software development.',
                    marks: 4,
                    max_score: 4,
                    user_answer: null,
                    ai_score_awarded: null,
                    ai_feedback: null,
                    user_confidence_rating: 6
                }
            ],
            currentQuizQuestion: {
                id: 'demo_quiz_1',
                question_id: 'quiz_1',
                topic_name: 'Algorithms',
                question_text: 'Explain the benefits of divide and conquer algorithms with one example.',
                marks: 4,
                max_score: 4,
                user_answer: 'They break problems into smaller parts to solve them faster, such as merge sort.',
                ai_score_awarded: 4,
                ai_feedback: 'Excellent answer with a strong example.',
                user_confidence_rating: this.getRandomConfidence(6, 10)
            },
            quizScore: 4,
            quizTotalQuestions: 3,
            questionsAnsweredInQuiz: 1,
            currentPackId: null,
            savedPacks: [
                {
                    id: 'pack_demo_1',
                    name: 'AQA CS Revision Pack',
                    folder: 'Mock Exam',
                    questions: [
                        'Explain how a stack is used during recursive function calls.',
                        'Describe the main security risks in client-server networks.',
                        'Outline the principles of test-driven development.'
                    ],
                    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'pack_demo_2',
                    name: 'Databases Focus Pack',
                    folder: 'Topic Practice',
                    questions: [
                        'What is a transaction and why is ACID important?',
                        'How does indexing speed up query performance?',
                        'Explain referential integrity and cascade delete behavior.'
                    ],
                    createdAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };

        this.saveState();
    },

    getRandomConfidence(min = 4, max = 10) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Save important application state into localStorage
    saveState() {
        const stateToSave = {
            isAuthenticated: this.state.isAuthenticated,
            authMode: this.state.authMode,
            token: this.state.token,
            user: this.state.user,
            examData: this.state.examData,
            revisionQueue: this.state.revisionQueue,
            currentQuestion: this.state.currentQuestion,
            questionsAnswered: this.state.questionsAnswered,
            totalConfidence: this.state.totalConfidence,
            quizMode: this.state.quizMode
        };
        localStorage.setItem('revisionAIState', JSON.stringify(stateToSave));
    },

    // Build headers for backend requests
    getRequestHeaders(isFormData = false) {
        const headers = {};
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        if (this.state.token) {
            headers['Authorization'] = `Bearer ${this.state.token}`;
        }
        return headers;
    },

    // Generic API helper for backend communication
    async apiRequest(method, path, body = null, isFormData = false) {
        const url = `${API_BASE_URL}${path}`;
        const options = {
            method,
            headers: this.getRequestHeaders(isFormData)
        };

        if (body) {
            options.body = isFormData ? body : JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            // Return mock data for demo purposes when backend is not available
            if (method === 'POST' && path.includes('/auth/')) {
                const isLogin = path.includes('/login');
                return {
                    email: body?.email || 'demo@example.com',
                    token: isLogin ? 'demo_token_' + Date.now() : null
                };
            }
            throw error;
        }
    },

    // Initialize Mermaid.js for rendering flowcharts
    initMermaid() {
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'forest',
            securityLevel: 'loose'
        });
    },

    // Display a specific view and initialize view-specific state
    showView(viewName) {
        this.state.currentView = viewName;
        document.querySelectorAll('.view').forEach((view) => view.classList.add('hidden'));
        
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.remove('hidden');
        }

        // Update navigation active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        const nav = document.getElementById('main-nav');
        if (this.state.isAuthenticated) {
            nav.classList.remove('hidden');
        } else {
            nav.classList.add('hidden');
        }

        // Initialize view-specific components
        if (viewName === 'dashboard') {
            this.initCalendar();
            this.renderTopicList();
            this.updateStats();
        }

        if (viewName === 'revision') {
            this.updateRevisionView();
        }

        if (viewName === 'quiz') {
            this.renderSavedQuizPacks();
            this.renderQuizPackDraft();
            this.refreshQuizInterface();
            this.updateQuizView();
        }
    },

    // Display the current user's email in the dashboard header
    setUserGreeting() {
        const greeting = document.getElementById('user-greeting');
        if (greeting && this.state.user) {
            greeting.innerHTML = `
                <span class="greeting-icon">👋</span>
                <span id="greeting-text">Welcome back, ${this.state.user.email.split('@')[0]}!</span>
            `;
        }
    },

    // Show error message
    showError(message) {
        const errorEl = document.getElementById('auth-error');
        const errorText = errorEl.querySelector('.error-text');
        if (errorEl && errorText) {
            errorText.textContent = message;
            errorEl.classList.remove('hidden');
        }
    },

    // Log the user out and clear saved state
    async logout() {
        if (typeof supabaseClient !== 'undefined') {
            await supabaseClient.auth.signOut();
        }
        this.state.isAuthenticated = false;
        this.state.user = null;
        this.state.token = null;
        localStorage.removeItem('revisionAIState');
        window.location.href = '/frontend/login.html';
    },

    // Initialize or update the calendar display using FullCalendar
    initCalendar() {
        const calendarEl = document.getElementById('calendar');
        if (!calendarEl) return;

        if (this.calendar) {
            this.calendar.destroy();
        }

        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            events: this.getCalendarEvents(),
            height: 'auto',
            editable: true,
            selectable: true,
            dayMaxEvents: 3,
            eventClick: (info) => {
                if (info.event.title.startsWith('Review:')) {
                    this.showToast(`Topic: ${info.event.title.replace('Review: ', '')}`, 'info');
                }
            }
        });

        this.calendar.render();
    },

    // Build calendar events from exam deadline and revision sessions
    getCalendarEvents() {
        const events = [];

        if (this.state.examData.date) {
            events.push({
                title: `📅 EXAM: ${this.state.examData.subject || 'Upcoming Exam'}`,
                start: this.state.examData.date,
                color: '#ef4444',
                backgroundColor: '#ef4444',
                borderColor: '#dc2626'
            });
        }

        this.state.revisionQueue.forEach((item, index) => {
            if (item.scheduledAt) {
                events.push({
                    title: `📝 Review: ${item.topic_name}`,
                    start: item.scheduledAt,
                    color: '#8b5cf6',
                    backgroundColor: '#8b5cf6',
                    borderColor: '#7c3aed'
                });
            } else {
                events.push({
                    title: `📋 Plan: ${item.topic_name}`,
                    start: this.state.examData.date || new Date().toISOString().slice(0, 10),
                    color: '#f59e0b',
                    backgroundColor: '#f59e0b',
                    borderColor: '#d97706'
                });
            }
        });

        return events;
    },

    // Save exam details and update schedule state
    async handleExamSubmit(event) {
        event.preventDefault();
        const subject = document.getElementById('exam-subject').value.trim();
        const date = document.getElementById('exam-date').value;

        if (!subject || !date) {
            this.showError('Please enter both subject and exam date.');
            return;
        }

        this.state.examData.subject = subject;
        this.state.examData.date = date;
        this.saveState();
        this.updateExamSummary();
        this.initCalendar();

        try {
            await this.apiRequest('POST', '/exam', this.state.examData);
            showToast('Exam schedule updated successfully!', 'success');
        } catch (error) {
            console.warn('Unable to persist exam data to backend:', error);
            showToast('Exam details saved locally.', 'info');
        }
    },

    // Add a new revision topic into the current exam plan
    handleAddTopic() {
        const topicInput = document.getElementById('topic-input');
        const topicValue = topicInput.value.trim();

        if (!topicValue) {
            return;
        }

        if (!this.state.examData.topics.includes(topicValue)) {
            this.state.examData.topics.push(topicValue);
            this.saveState();
            this.renderTopicList();
            this.updateStats();
            topicInput.value = '';
        } else {
            this.showToast('Topic already exists in your list.', 'warning');
        }
    },

    // Remove a topic from the plan by index
    removeTopic(index) {
        this.state.examData.topics.splice(index, 1);
        this.saveState();
        this.renderTopicList();
        this.updateStats();
    },

    // Render the topic list in the dashboard
    renderTopicList() {
        const topicList = document.getElementById('topic-list');
        const emptyState = document.getElementById('topic-empty-state');
        const generateBtn = document.getElementById('generate-plan-btn');

        if (!topicList) return;

        if (this.state.examData.topics.length > 0) {
            emptyState.style.display = 'none';
            generateBtn.classList.remove('hidden');
            topicList.innerHTML = this.state.examData.topics.map((topic, index) => {
                return `<li>
                            <span>${topic}</span>
                            <button type="button" class="remove-topic" onclick="app.removeTopic(${index})">Remove</button>
                        </li>`;
            }).join('');
        } else {
            emptyState.style.display = 'flex';
            generateBtn.classList.add('hidden');
            topicList.innerHTML = '';
        }
    },

    // Generate a revision queue based on selected topics and exam deadline
    async generateRevisionPlan() {
        if (!this.state.examData.date) {
            this.showError('Set the exam date first so the schedule can adapt to the deadline.');
            return;
        }

        if (this.state.examData.topics.length === 0) {
            this.showError('Add at least one revision topic before generating the plan.');
            return;
        }

        showLoading('Generating adaptive revision plan...');

        try {
            const response = await this.apiRequest('POST', '/revision-plan', {
                topics: this.state.examData.topics,
                examDate: this.state.examData.date
            });

            if (response?.revisionQueue) {
                this.state.revisionQueue = response.revisionQueue;
            } else {
                const nextWeek = this.createDateSequence(this.state.examData.date, this.state.examData.topics.length);
                this.state.revisionQueue = this.state.examData.topics.map((topic, index) => ({
                    id: `q_${Date.now()}_${index}`,
                    topic_name: topic,
                    question: `Explain the core concepts of ${topic} in your own words.`,
                    confidence: 5,
                    scheduledAt: nextWeek[index],
                    lastFeedback: 'No submissions yet.',
                    ai_score_awarded: null,
                    ai_max_score: null
                }));
            }

            this.saveState();
            this.initCalendar();
            this.updateExamSummary();
            this.updateRevisionView();
            this.updateStats();
            showToast('Adaptive plan generated successfully!', 'success');
        } catch (error) {
            console.warn('Unable to fetch plan from backend, using local fallback:', error);
            const nextWeek = this.createDateSequence(this.state.examData.date, this.state.examData.topics.length);
            this.state.revisionQueue = this.state.examData.topics.map((topic, index) => ({
                id: `q_${Date.now()}_${index}`,
                topic_name: topic,
                question: `Explain the core concepts of ${topic} in your own words.`,
                confidence: 5,
                scheduledAt: nextWeek[index],
                lastFeedback: 'No submissions yet.',
                ai_score_awarded: null,
                ai_max_score: null
            }));

            this.saveState();
            this.initCalendar();
            this.updateExamSummary();
            this.updateRevisionView();
            this.updateStats();
            showToast('Adaptive plan generated locally because the server was unavailable.', 'warning');
        } finally {
            hideLoading();
        }
    },

    // Build a simple date sequence of sessions before the exam
    createDateSequence(examDate, itemCount) {
        const result = [];
        const target = new Date(examDate);
        const start = new Date(target);
        start.setDate(target.getDate() - Math.max(7, itemCount * 3));

        for (let i = 0; i < itemCount; i += 1) {
            const next = new Date(start);
            next.setDate(start.getDate() + i * 2);
            if (next > target) {
                next.setDate(target.getDate() - (itemCount - i));
            }
            result.push(next.toISOString().slice(0, 10));
        }

        return result;
    },

    // Update the countdown and summary text in the dashboard
    updateExamSummary() {
        const countdownEl = document.getElementById('exam-countdown');
        const summaryEl = document.getElementById('revision-summary');

        if (!countdownEl || !summaryEl) return;

        if (!this.state.examData.date) {
            countdownEl.innerText = '--';
            summaryEl.innerText = 'Add topics and generate the plan to see your calendar filled.';
            return;
        }

        const examDate = new Date(this.state.examData.date);
        const now = new Date();
        const deltaDays = Math.max(0, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));
        const sessionCount = this.state.revisionQueue.length + (this.state.currentQuestion ? 1 : 0);
        const avgConfidenceEl = document.getElementById('avg-confidence');

        countdownEl.innerText = deltaDays > 0 ? `${deltaDays} day${deltaDays === 1 ? '' : 's'}` : 'Today!';
        summaryEl.innerText = `${this.state.examData.topics.length} topics and ${sessionCount} revision sessions are ready for review.`;

        if (avgConfidenceEl && this.state.revisionQueue.length > 0) {
            const totalConfidence = this.state.revisionQueue.reduce((sum, item) => sum + (item.confidence || 5), 0);
            const avg = Math.round(totalConfidence / this.state.revisionQueue.length);
            avgConfidenceEl.innerText = `${avg}%`;
        }
    },

    // Reset the flowchart view to the placeholder state
    resetFlowchartView() {
        const container = document.getElementById('mermaid-container');
        if (container) {
            container.innerHTML = '<div class="mermaid-empty-state"><span class="empty-icon">📊</span><p>Upload an image to see the decomposed flowchart structure here.</p></div>';
        }
        
        const exportBtn = document.getElementById('export-mermaid-btn');
        if (exportBtn) {
            exportBtn.classList.add('hidden');
        }
    },

    // Handle file upload and send it to the backend for decomposition
    async handleFileUpload(file) {
        const statusEl = document.getElementById('upload-status');
        const dropZone = document.getElementById('drop-zone');
        
        if (!file) return;

        showLoading('Processing flowchart image...');
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = '<span class="status-icon">⏳</span><span class="status-text">Uploading and analyzing...</span>';
        dropZone.style.borderColor = 'var(--primary-color)';

        // For demo purposes, show a sample flowchart
        setTimeout(() => {
            const mermaidSyntax = `graph TD
    A[Start] --> B{Is input valid?}
    B -- No --> C[Show error message]
    B -- Yes --> D[Process data]
    D --> E{Check conditions}
    E -- Condition met --> F[Execute action]
    E -- Not met --> G[Skip action]
    F --> H[Update state]
    G --> H
    H --> I{All done?}
    I -- No --> A
    I -- Yes --> J[End]`;

            this.renderMermaid(mermaidSyntax);
            statusEl.innerHTML = '<span class="status-icon">✅</span><span class="status-text">Flowchart decomposed successfully!</span>';
            hideLoading();
        }, 2000);
    },

    // Render Mermaid syntax into the flowchart container
    async renderMermaid(syntax) {
        const container = document.getElementById('mermaid-container');
        if (!container) return;

        container.innerHTML = syntax;
        try {
            await mermaid.run({ nodes: [container] });
        } catch (error) {
            console.error('Mermaid rendering failed:', error);
        }
    },

    // Load code templates
    loadTemplate(type) {
        const templates = {
            forLoop: `graph TD
    A[Start] --> B[Initialize counter]
    B --> C{Counter < limit?}
    C -- Yes --> D[Execute loop body]
    D --> E[Increment counter]
    E --> C
    C -- No --> F[End loop]`,

            whileLoop: `graph TD
    A[Start] --> B[Initialize variables]
    B --> C{Condition true?}
    C -- Yes --> D[Execute loop body]
    D --> E[Update condition]
    E --> C
    C -- No --> F[End loop]`,

            recursion: `graph TD
    A[Start] --> B[Base case check]
    B -- Base case --> C[Return result]
    B -- Not base case --> D[Make recursive call]
    D --> E[Process current level]
    E --> F[Combine results]
    F --> B`,

            ifElse: `graph TD
    A[Start] --> B{Condition?}
    B -- True --> C[Execute true block]
    B -- False --> D[Execute false block]
    C --> E[End]
    D --> E`
        };

        if (templates[type]) {
            this.renderMermaid(templates[type]);
            showToast(`Loaded ${type} template`, 'success');
        }
    },

    // Update the visible revision question and queue
    updateRevisionView() {
        const topicQueueList = document.getElementById('topic-queue-list');
        const questionTopic = document.getElementById('question-topic');
        const questionContent = document.getElementById('question-content');
        const topicBadge = document.getElementById('question-topic-badge');
        const marksText = document.getElementById('marks-text');
        const queueCount = document.getElementById('queue-count');
        const progressValue = document.getElementById('progress-value');
        const progressFill = document.getElementById('progress-fill');
        const completeBtn = document.getElementById('complete-question-btn');

        if (topicQueueList) {
            topicQueueList.innerHTML = this.state.revisionQueue.map((item, index) => {
                return `<li class="queue-item">
                            <span>${index + 1}. ${item.topic_name}</span>
                            <span class="confidence-indicator">${item.confidence || 5}/10</span>
                        </li>`;
            }).join('');
        }

        if (this.state.currentQuestion) {
            questionTopic.innerText = this.state.currentQuestion.topic_name;
            questionContent.innerHTML = `<strong>${this.state.currentQuestion.question}</strong>`;
            
            // Update badge and marks
            if (topicBadge) topicBadge.innerHTML = `<span class="badge-icon">📚</span><span>${this.state.currentQuestion.topic_name}</span>`;
            if (marksText) marksText.innerHTML = `<span class="marks-icon">🎯</span><span>-- marks</span>`;
            
            // Update queue count and progress
            if (queueCount) queueCount.innerText = `${this.state.revisionQueue.length} topics`;
            if (progressValue) progressValue.innerText = `1/${this.state.revisionQueue.length}`;
            if (progressFill) progressFill.style.width = `${(1 / this.state.revisionQueue.length) * 100}%`;
            
            // Show complete button
            if (completeBtn) completeBtn.classList.remove('hidden');
        } else {
            questionTopic.innerText = 'Ready to Start';
            questionContent.innerHTML = '<div class="question-empty-state"><span class="empty-icon">💡</span><p>Press <strong>"Next Question"</strong> to load your first adaptive question based on your revision plan.</p></div>';
            
            if (topicBadge) topicBadge.innerHTML = `<span class="badge-icon">📚</span><span>Ready to Start</span>`;
            if (marksText) marksText.innerHTML = `<span class="marks-icon">🎯</span><span>-- marks</span>`;
            
            // Hide complete button
            if (completeBtn) completeBtn.classList.add('hidden');
        }
    },

    // Load the next question into the active revision view
    async loadNextQuestion() {
        if (this.state.revisionQueue.length === 0) {
            this.showError('Please generate an adaptive plan first so there are questions to review.');
            return;
        }

        showLoading('Generating next question...');

        setTimeout(() => {
            if (this.state.revisionQueue.length > 0) {
                const next = this.state.revisionQueue.shift();
                this.state.currentQuestion = next;
                this.saveState();
                this.updateRevisionView();
                showToast('New question loaded!', 'success');
            }
            hideLoading();
        }, 1000);
    },

    // --- Quiz Mode Functions ---

    // Toggle quiz mode on/off
    toggleQuizMode() {
        this.state.quizMode.enabled = !this.state.quizMode.enabled;

        const startBtn = document.getElementById('start-quiz-btn');
        if (startBtn) {
            if (this.state.quizMode.enabled) {
                startBtn.classList.add('hidden');
            } else {
                startBtn.classList.remove('hidden');
            }
        }

        if (this.state.quizMode.enabled) {
            if (!this.state.quizMode.currentQuizQuestion && this.state.quizMode.questionQueue.length === 0) {
                this.startQuiz();
            } else {
                this.refreshQuizInterface();
            }
        } else {
            this.refreshQuizInterface();
        }

        this.saveState();
    },

    refreshQuizInterface() {
        const quizCard = document.querySelector('#view-quiz .card.quiz-card');
        const scoreCard = document.querySelector('#view-quiz .card.score-card');
        const startBtn = document.getElementById('start-quiz-btn');

        if (!quizCard || !scoreCard) return;

        if (this.state.quizMode.enabled) {
            quizCard.innerHTML = `
                <div class="quiz-progress">
                    <span class="progress-label">Question</span>
                    <span class="progress-value" id="quiz-question-number">1 / ${this.state.quizMode.quizTotalQuestions || 0}</span>
                </div>
                <div id="quiz-question-content" class="question-text"></div>
                <hr class="divider">
                <div class="input-group">
                    <label for="quiz-user-answer">
                        <span class="label-icon">✍️</span> Your Answer
                    </label>
                    <textarea id="quiz-user-answer" rows="8" placeholder="Type your response here... Take your time to explain your reasoning."></textarea>
                    <span class="char-count" id="quiz-char-count">0 characters</span>
                </div>
                <div class="answer-actions">
                    <button id="submit-quiz-answer-btn" class="btn-primary btn-large">
                        <span>Submit Answer</span>
                        <span class="btn-icon-small">📝</span>
                    </button>
                    <button type="button" id="next-quiz-question-btn" class="btn-secondary btn-large hidden">
                        <span>Next Question</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            `;

            scoreCard.innerHTML = `
                <div class="card-header">
                    <h3>Score</h3>
                </div>
                <div class="score-display">
                    <span id="quiz-score">0</span><span>/0</span>
                </div>
            `;
        } else {
            quizCard.innerHTML = `
                <div class="card-header">
                    <h3>Quiz Progress</h3>
                </div>
                <div class="quiz-empty-state">
                    <span class="empty-icon">🎯</span>
                    <p>Ready to start your quiz. Click Start Quiz to generate questions from your revision topics.</p>
                </div>
            `;

            scoreCard.innerHTML = `
                <div class="card-header">
                    <h3>Score</h3>
                </div>
                <div class="score-display">
                    <span id="quiz-score">0</span><span>/0</span>
                </div>
            `;
        }

        if (startBtn) {
            startBtn.classList.toggle('hidden', this.state.quizMode.enabled);
        }

        this.bindQuizInteractionButtons();
        this.renderSavedQuizPacks();
        this.saveState();
    },

    bindQuizInteractionButtons() {
        const nextQuizQuestionBtn = document.getElementById('next-quiz-question-btn');
        if (nextQuizQuestionBtn && !nextQuizQuestionBtn.dataset.bound) {
            nextQuizQuestionBtn.addEventListener('click', () => this.loadNextQuizQuestion());
            nextQuizQuestionBtn.dataset.bound = 'true';
        }

        const submitQuizAnswerBtn = document.getElementById('submit-quiz-answer-btn');
        if (submitQuizAnswerBtn && !submitQuizAnswerBtn.dataset.bound) {
            submitQuizAnswerBtn.addEventListener('click', (event) => this.submitQuizAnswer(event));
            submitQuizAnswerBtn.dataset.bound = 'true';
        }

        const answerInput = document.getElementById('quiz-user-answer');
        if (answerInput && !answerInput.dataset.bound) {
            answerInput.addEventListener('input', (event) => {
                const countEl = document.getElementById('quiz-char-count');
                if (countEl) countEl.innerText = `${event.target.value.length} characters`;
            });
            answerInput.dataset.bound = 'true';
        }

        const confidenceSlider = document.getElementById('quiz-confidence-slider');
        if (confidenceSlider && !confidenceSlider.dataset.bound) {
            confidenceSlider.addEventListener('input', (event) => {
                const valueEl = document.getElementById('quiz-confidence-value');
                if (valueEl) valueEl.textContent = event.target.value;
            });
            confidenceSlider.dataset.bound = 'true';
        }
    },

    // Start a new quiz session
    async startQuiz() {
        if (this.state.examData.topics.length === 0) {
            this.showError('Add topics to your exam plan first before starting a quiz.');
            return;
        }

        showLoading('Generating quiz questions from your revision topics...');

        try {
            // Generate questions for each topic in the queue
            const questions = [];
            for (const topic of this.state.examData.topics) {
                const response = await this.apiRequest('POST', '/questions/generate', {
                    topic: topic,
                    examBoard: this.state.examData.board,
                    maxScore: 4
                });
                
                if (response && response.question) {
                    questions.push({
                        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        question_id: response.question.id || topic,
                        topic_name: topic,
                        question_text: response.question.text || response.question,
                        marks: response.question.marks || 4,
                        max_score: response.question.max_score || 4,
                        user_answer: null,
                        ai_score_awarded: null,
                        ai_feedback: null,
                        user_confidence_rating: this.getRandomConfidence(4, 9)
                    });
                }
            }

            this.state.quizMode.questionQueue = questions;
            this.state.quizMode.quizTotalQuestions = questions.length;
            this.state.quizMode.currentQuizQuestion = questions[0] || null;
            this.state.quizMode.quizScore = 0;
            
            this.saveState();
            this.updateQuizView();
            showToast(`Quiz started with ${questions.length} questions!`, 'success');
        } catch (error) {
            console.error('Failed to generate quiz:', error);
            const fallbackQuestions = this.state.examData.topics.map((topic, index) => ({
                id: `fallback_quiz_${index}`,
                question_id: `fallback_${index}`,
                topic_name: topic,
                question_text: `Write a short exam-style answer about ${topic} and its key concepts.`,
                marks: 4,
                max_score: 4,
                user_answer: null,
                ai_score_awarded: null,
                ai_feedback: null,
                user_confidence_rating: this.getRandomConfidence(4, 9)
            }));

            this.state.quizMode.questionQueue = fallbackQuestions;
            this.state.quizMode.quizTotalQuestions = fallbackQuestions.length;
            this.state.quizMode.currentQuizQuestion = fallbackQuestions[0] || null;
            this.state.quizMode.quizScore = 0;
            
            this.saveState();
            this.updateQuizView();
            showToast('Quiz generated locally for presentation mode.', 'info');
        } finally {
            hideLoading();
        }
    },

    // Update the quiz view with current question and score
    updateQuizView() {
        const questionContent = document.getElementById('quiz-question-content');
        const quizScoreEl = document.getElementById('quiz-score');
        const quizQuestionNumber = document.getElementById('quiz-question-number');
        const nextQuizBtn = document.getElementById('next-quiz-question-btn');
        const submitQuizBtn = document.getElementById('submit-quiz-answer-btn');
        const feedbackCard = document.getElementById('quiz-feedback-card');
        const confidenceCard = document.getElementById('quiz-confidence-card');

        if (this.state.quizMode.currentQuizQuestion) {
            if (questionContent) {
                questionContent.innerHTML = `<strong>${this.state.quizMode.currentQuizQuestion.question_text}</strong>`;
            }
            
            if (quizScoreEl) {
                quizScoreEl.innerText = this.state.quizMode.quizScore;
            }
            
            if (quizQuestionNumber) {
                quizQuestionNumber.innerText = `${this.state.quizMode.questionsAnsweredInQuiz + 1} / ${this.state.quizMode.quizTotalQuestions}`;
            }

            if (nextQuizBtn) nextQuizBtn.classList.add('hidden');
            if (submitQuizBtn) submitQuizBtn.classList.remove('hidden');
            if (feedbackCard) feedbackCard.classList.remove('hidden');
            if (confidenceCard) confidenceCard.classList.remove('hidden');
        } else {
            if (questionContent) {
                questionContent.innerHTML = '<div class="question-empty-state"><span class="empty-icon">💡</span><p>No questions available. Start a quiz to begin.</p></div>';
            }
            if (quizScoreEl) quizScoreEl.innerText = '0';
            if (quizQuestionNumber) quizQuestionNumber.innerText = '0 / 0';
            if (nextQuizBtn) nextQuizBtn.classList.add('hidden');
            if (submitQuizBtn) submitQuizBtn.classList.add('hidden');
            if (feedbackCard) feedbackCard.classList.add('hidden');
            if (confidenceCard) confidenceCard.classList.add('hidden');
        }
    },

    // Load the next question in the quiz queue
    async loadNextQuizQuestion() {
        const currentQuestion = this.state.quizMode.currentQuizQuestion;
        
        if (!currentQuestion) {
            this.showError('No questions available. Start a quiz first.');
            return;
        }

        // Remove answered question from queue
        this.state.quizMode.questionQueue = this.state.quizMode.questionQueue.filter(
            q => q.id !== currentQuestion.id
        );

        if (this.state.quizMode.questionQueue.length > 0) {
            const nextQuestion = this.state.quizMode.questionQueue.shift();
            this.state.quizMode.currentQuizQuestion = nextQuestion;
            this.state.quizMode.questionsAnsweredInQuiz++;
            
            this.saveState();
            this.updateQuizView();
            showToast('Next question loaded!', 'success');
        } else {
            // Quiz completed
            this.completeQuiz();
        }

        this.saveState();
    },

    // Complete the quiz when all questions are answered
    completeQuiz() {
        const quizCard = document.querySelector('#view-quiz .card.quiz-card');
        const scoreCard = document.querySelector('#view-quiz .card.score-card');
        
        if (quizCard) quizCard.innerHTML = `
            <div class="card-header">
                <h3>Quiz Progress</h3>
            </div>
            <div class="quiz-completed-state">
                <span class="empty-icon">🎉</span>
                <p><strong>Quiz Completed!</strong></p>
                <p>You answered all ${this.state.quizMode.quizTotalQuestions} questions.</p>
                <p>Your final score: <strong>${this.state.quizMode.quizScore}</strong> out of ${this.state.quizMode.quizTotalQuestions * 4}</p>
            </div>
        `;
        
        if (scoreCard) scoreCard.innerHTML = `
            <div class="card-header">
                <h3>Final Score</h3>
            </div>
            <div class="score-display">
                <span>${this.state.quizMode.quizScore}</span><span>/0</span>
            </div>
        `;

        this.saveState();
        showToast('Quiz completed! Great effort!', 'success');
    },

    // Submit answer for quiz question
    async submitQuizAnswer(event) {
        event.preventDefault();
        const answerText = document.getElementById('quiz-user-answer').value.trim();
        const confidence = Number(document.getElementById('quiz-confidence-slider').value);
        
        if (!this.state.quizMode.currentQuizQuestion) {
            this.showError('Load a question first.');
            return;
        }

        if (!answerText) {
            this.showError('Please type your answer before submitting.');
            return;
        }

        const currentQuestion = this.state.quizMode.currentQuizQuestion;
        const charCount = document.getElementById('quiz-char-count');
        
        if (charCount) {
            charCount.innerText = `${answerText.length} characters`;
        }

        showLoading('AI is grading your answer...');

        try {
            const response = await this.apiRequest('POST', `/questions/${currentQuestion.id}/submit`, {
                answer: answerText,
                confidence
            });

            // Update question with feedback
            currentQuestion.user_answer = answerText;
            currentQuestion.ai_score_awarded = response.ai_score_awarded || null;
            currentQuestion.ai_feedback = response.ai_feedback || 'Great effort! Keep practicing.';
            currentQuestion.user_confidence_rating = confidence;

            // Update score if question was answered correctly
            if (currentQuestion.ai_score_awarded !== null) {
                this.state.quizMode.quizScore += currentQuestion.ai_score_awarded;
            }

            // Update feedback display
            const feedbackEl = document.querySelector('#view-quiz .card.quiz-card .input-group');
            if (feedbackEl) {
                feedbackEl.innerHTML = `
                    <div class="feedback-content">
                        <p><strong>Feedback:</strong></p>
                        <p>${currentQuestion.ai_feedback}</p>
                        ${currentQuestion.ai_score_awarded ? `<span class="score-badge">Score: ${currentQuestion.ai_score_awarded}/${currentQuestion.max_score}</span>` : ''}
                    </div>
                `;
            }

            // Load next question
            this.loadNextQuizQuestion();
            
            // Clear answer textarea
            document.getElementById('quiz-user-answer').value = '';
            charCount.innerText = '0 characters';

            this.saveState();
            showToast('Answer submitted and graded!', 'success');
        } catch (error) {
            console.warn('Answer submission failed:', error);
            const feedbackEl = document.querySelector('#view-quiz .card.quiz-card .input-group');
            if (feedbackEl) {
                feedbackEl.innerHTML = '<div class="feedback-content"><p><strong>Feedback:</strong></p><p>Unable to submit answer. Please check your connection.</p></div>';
            }
        } finally {
            hideLoading();
        }
    },

    // Setup quiz mode event listeners
    setupQuizEventListeners() {
        const startQuizBtn = document.getElementById('start-quiz-btn');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.toggleQuizMode());
        }

        const nextQuizQuestionBtn = document.getElementById('next-quiz-question-btn');
        if (nextQuizQuestionBtn) {
            nextQuizQuestionBtn.addEventListener('click', () => this.loadNextQuizQuestion());
        }

        const submitQuizAnswerBtn = document.getElementById('submit-quiz-answer-btn');
        if (submitQuizAnswerBtn) {
            submitQuizAnswerBtn.addEventListener('click', (event) => this.submitQuizAnswer(event));
        }

        const addPackQuestionBtn = document.getElementById('add-pack-question-btn');
        if (addPackQuestionBtn) {
            addPackQuestionBtn.addEventListener('click', () => this.addQuizPackQuestion());
        }

        const savePackBtn = document.getElementById('save-pack-btn');
        if (savePackBtn) {
            savePackBtn.addEventListener('click', () => this.saveQuizPack());
        }

        const filterSelect = document.getElementById('pack-folder-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.renderSavedQuizPacks());
        }

        const packNameInput = document.getElementById('quiz-pack-name');
        if (packNameInput) {
            packNameInput.addEventListener('input', (event) => {
                this.state.quizMode.packDraft.name = event.target.value;
                this.saveState();
            });
        }

        const packFolderInput = document.getElementById('quiz-pack-folder');
        if (packFolderInput) {
            packFolderInput.addEventListener('input', (event) => {
                this.state.quizMode.packDraft.folder = event.target.value;
                this.saveState();
            });
        }
    },

    addQuizPackQuestion() {
        const questionInput = document.getElementById('quiz-pack-question-input');
        if (!questionInput) return;

        const questionText = questionInput.value.trim();
        if (!questionText) {
            showToast('Enter a question before adding it to the draft.', 'warning');
            return;
        }

        this.state.quizMode.packDraft.questions.push(questionText);
        questionInput.value = '';
        this.saveState();
        this.renderQuizPackDraft();
        showToast('Question added to pack draft.', 'success');
    },

    saveQuizPack() {
        const packDraft = this.state.quizMode.packDraft;
        if (!packDraft.name.trim()) {
            showToast('Give your quiz pack a name before saving.', 'warning');
            return;
        }

        if (packDraft.questions.length === 0) {
            showToast('Add at least one question to the pack before saving.', 'warning');
            return;
        }

        const newPack = {
            id: `pack_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            name: packDraft.name.trim(),
            folder: packDraft.folder.trim() || 'General',
            questions: [...packDraft.questions],
            createdAt: new Date().toISOString()
        };

        this.state.quizMode.savedPacks.unshift(newPack);
        this.state.quizMode.packDraft = {
            name: '',
            folder: '',
            questions: []
        };
        this.saveState();
        this.renderQuizPackDraft();
        this.renderSavedQuizPacks();
        showToast('Quiz pack saved successfully.', 'success');
    },

    renderQuizPackDraft() {
        const packNameInput = document.getElementById('quiz-pack-name');
        const packFolderInput = document.getElementById('quiz-pack-folder');
        const draftList = document.getElementById('quiz-pack-draft-list');

        if (packNameInput) {
            packNameInput.value = this.state.quizMode.packDraft.name || '';
        }
        if (packFolderInput) {
            packFolderInput.value = this.state.quizMode.packDraft.folder || '';
        }

        if (!draftList) return;

        if (this.state.quizMode.packDraft.questions.length === 0) {
            draftList.innerHTML = `<p class="empty-state-text">No questions in the draft yet. Add one to start building your pack.</p>`;
            return;
        }

        draftList.innerHTML = this.state.quizMode.packDraft.questions.map((question, index) => {
            return `
                <div class="draft-question-item">
                    <span>${index + 1}. ${question}</span>
                    <button type="button" class="btn-text" onclick="app.removeDraftQuestion(${index})">Remove</button>
                </div>
            `;
        }).join('');
    },

    removeDraftQuestion(index) {
        if (index < 0 || index >= this.state.quizMode.packDraft.questions.length) return;
        this.state.quizMode.packDraft.questions.splice(index, 1);
        this.saveState();
        this.renderQuizPackDraft();
    },

    renderSavedQuizPacks() {
        const listEl = document.getElementById('saved-packs-list');
        const folderSelect = document.getElementById('pack-folder-filter');
        if (!listEl || !folderSelect) return;

        const packs = this.getFilteredQuizPacks();
        const uniqueFolders = Array.from(new Set(this.state.quizMode.savedPacks.map(pack => pack.folder || 'General'))).sort();

        folderSelect.innerHTML = `<option value="all">All folders</option>` + uniqueFolders.map(folder => {
            return `<option value="${folder}">${folder}</option>`;
        }).join('');

        if (packs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state-text">
                    <span class="empty-icon">📦</span>
                    <p>No saved packs yet. Create one to revisit questions later.</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = packs.map((pack) => {
            return `
                <div class="saved-pack-item">
                    <div class="saved-pack-meta">
                        <h4>${pack.name}</h4>
                        <span class="pack-folder">${pack.folder}</span>
                        <span class="pack-count">${pack.questions.length} questions</span>
                    </div>
                    <p class="pack-created">Created ${new Date(pack.createdAt).toLocaleDateString()}</p>
                    <div class="pack-actions">
                        <button type="button" class="btn-secondary btn-small" onclick="app.loadQuizPack('${pack.id}')">Open Draft</button>
                        <button type="button" class="btn-primary btn-small" onclick="app.startQuizFromPack('${pack.id}')">Use Pack</button>
                        <button type="button" class="btn-text" onclick="app.removeQuizPack('${pack.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    getFilteredQuizPacks() {
        const folderSelect = document.getElementById('pack-folder-filter');
        const selected = folderSelect ? folderSelect.value : 'all';
        if (!this.state.quizMode.savedPacks || selected === 'all') {
            return this.state.quizMode.savedPacks;
        }
        return this.state.quizMode.savedPacks.filter(pack => pack.folder === selected);
    },

    loadQuizPack(packId) {
        const pack = this.state.quizMode.savedPacks.find(item => item.id === packId);
        if (!pack) {
            showToast('Quiz pack not found.', 'error');
            return;
        }

        this.state.quizMode.packDraft = {
            name: pack.name,
            folder: pack.folder,
            questions: [...pack.questions]
        };

        this.saveState();
        this.renderQuizPackDraft();
        showToast(`Loaded pack “${pack.name}” into the draft.`, 'success');
    },

    removeQuizPack(packId) {
        this.state.quizMode.savedPacks = this.state.quizMode.savedPacks.filter(item => item.id !== packId);
        this.saveState();
        this.renderSavedQuizPacks();
        showToast('Quiz pack deleted.', 'info');
    },

    startQuizFromPack(packId) {
        const pack = this.state.quizMode.savedPacks.find(item => item.id === packId);
        if (!pack || pack.questions.length === 0) {
            showToast('This pack has no questions to start a quiz.', 'warning');
            return;
        }

        const questions = pack.questions.map((questionText, index) => ({
            id: `packquiz_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
            question_id: `${pack.id}_${index}`,
            topic_name: pack.folder || 'Quiz Pack',
            question_text: questionText,
            marks: 4,
            max_score: 4,
            user_answer: null,
            ai_score_awarded: null,
            ai_feedback: null,
            user_confidence_rating: 5
        }));

        this.state.quizMode.enabled = true;
        this.state.quizMode.questionQueue = questions.slice(1);
        this.state.quizMode.quizTotalQuestions = questions.length;
        this.state.quizMode.currentQuizQuestion = questions[0];
        this.state.quizMode.quizScore = 0;
        this.state.quizMode.questionsAnsweredInQuiz = 0;
        this.state.quizMode.currentPackId = pack.id;

        this.saveState();
        this.showView('quiz');
        this.refreshQuizInterface();
        this.updateQuizView();
        showToast(`Started quiz from pack “${pack.name}”.`, 'success');
    },

    async submitAnswer(event) {
        event.preventDefault();
        const answerText = document.getElementById('user-answer').value.trim();
        const confidence = Number(document.getElementById('confidence-slider').value);
        const feedbackEl = document.getElementById('feedback-content');
        const scoreBadge = document.getElementById('feedback-score');
        const charCount = document.getElementById('char-count');

        if (!this.state.currentQuestion) {
            this.showError('Load a question first using Next Question.');
            return;
        }

        if (!answerText) {
            this.showError('Please type your answer before submitting.');
            return;
        }

        // Update character count
        charCount.innerText = `${answerText.length} characters`;

        feedbackEl.innerHTML = '<div class="feedback-loading"><span class="loading-icon">⏳</span><p>AI is grading your answer...</p></div>';
        scoreBadge.classList.add('hidden');

        showLoading('Grading your answer...');

        try {
            const response = await this.apiRequest('POST', `/questions/${this.state.currentQuestion.id}/submit`, {
                answer: answerText,
                confidence
            });

            // Update state with feedback
            this.state.currentQuestion.lastFeedback = response.ai_feedback || 'Answer submitted successfully.';
            this.state.currentQuestion.confidence = confidence;
            this.state.currentQuestion.attempts = (this.state.currentQuestion.attempts || 0) + 1;
            
            // Track stats
            this.state.questionsAnswered++;
            this.state.totalConfidence += confidence;

            // Update feedback display
            feedbackEl.innerHTML = `
                <div class="feedback-content">
                    <p><strong>Feedback:</strong></p>
                    <p>${response.ai_feedback || 'Great effort! Keep practicing.'}</p>
                    ${response.ai_score_awarded ? `<span class="score-badge">Score: ${response.ai_score_awarded}/${response.ai_max_score}</span>` : ''}
                </div>
            `;
            scoreBadge.classList.remove('hidden');

            // Reprioritize revision queue
            this.reprioritizeRevisionQueue();
            
            // Clear answer textarea
            document.getElementById('user-answer').value = '';
            charCount.innerText = '0 characters';

            this.saveState();
            this.updateRevisionView();
            this.updateStats();
            showToast('Answer submitted and graded!', 'success');
        } catch (error) {
            console.warn('Answer submission failed:', error);
            feedbackEl.innerHTML = '<div class="feedback-content"><p><strong>Feedback:</strong></p><p>Unable to submit answer. Please check your connection.</p></div>';
        } finally {
            hideLoading();
        }
    },

    // Reorder the revision queue so lower confidence topics appear sooner
    reprioritizeRevisionQueue() {
        if (!this.state.currentQuestion) return;

        this.state.revisionQueue = this.state.revisionQueue.map((item) => {
            if (item.id === this.state.currentQuestion.id) {
                return { ...item, confidence: this.state.currentQuestion.confidence };
            }
            return item;
        });

        // Sort by confidence (lower first)
        this.state.revisionQueue.sort((a, b) => (a.confidence || 5) - (b.confidence || 5));
    },

    // Complete current question and move to next
    completeCurrentQuestion() {
        if (!this.state.currentQuestion) return;
        
        // Remove from queue and load next
        this.state.revisionQueue = this.state.revisionQueue.filter((item) => item.id !== this.state.currentQuestion.id);
        this.state.currentQuestion = null;
        this.saveState();
        this.updateRevisionView();
        showToast('Question completed!', 'success');
    },

    // Apply theme selection during initialization
    initTheme() {
        const savedTheme = localStorage.getItem('revisionAITheme');
        this.state.theme = savedTheme === 'dark' ? 'dark' : 'light';
        this.applyTheme();
    },

    // Toggle between light and dark mode and persist the choice
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('revisionAITheme', this.state.theme);
        this.applyTheme();
        
        const themeBtn = document.getElementById('theme-toggle-btn');
        if (themeBtn) {
            themeBtn.querySelector('.theme-icon').textContent = 
                this.state.theme === 'dark' ? '☀️' : '🌙';
        }
    },

    // Apply theme by updating the data attribute and button label
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.state.theme);
    },

    // Setup DOM listeners for all interactive controls
    setupEventListeners() {
        const examForm = document.getElementById('exam-form');
        if (examForm) {
            examForm.addEventListener('submit', (event) => this.handleExamSubmit(event));
        }

        const addTopicBtn = document.getElementById('add-topic-btn');
        if (addTopicBtn) {
            addTopicBtn.addEventListener('click', () => this.handleAddTopic());
        }

        const generatePlanBtn = document.getElementById('generate-plan-btn');
        if (generatePlanBtn) {
            generatePlanBtn.addEventListener('click', () => this.generateRevisionPlan());
        }

        const nextQuestionBtn = document.getElementById('next-question-btn');
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', () => this.loadNextQuestion());
        }

        const submitAnswerBtn = document.getElementById('submit-answer-btn');
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', (event) => this.submitAnswer(event));
        }

        const confidenceSlider = document.getElementById('confidence-slider');
        if (confidenceSlider) {
            confidenceSlider.addEventListener('input', (event) => {
                const value = event.target.value;
                const valueEl = document.getElementById('confidence-value');
                if (valueEl) valueEl.textContent = value;
            });
        }

        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => this.toggleTheme());
        }

        const completeQuestionBtn = document.getElementById('complete-question-btn');
        if (completeQuestionBtn) {
            completeQuestionBtn.addEventListener('click', () => this.completeCurrentQuestion());
        }

        const exportMermaidBtn = document.getElementById('export-mermaid-btn');
        if (exportMermaidBtn) {
            exportMermaidBtn.addEventListener('click', () => {
                const mermaidCode = document.getElementById('mermaid-container').innerText;
                navigator.clipboard.writeText(mermaidCode).then(() => {
                    showToast('Mermaid code copied to clipboard!', 'success');
                });
            });
        }

        // Set minimum date for exam date picker to today
        const examDateInput = document.getElementById('exam-date');
        if (examDateInput) {
            const today = new Date().toISOString().split('T')[0];
            examDateInput.min = today;
        }
    }
};

// Initialize the app after DOM loads
document.addEventListener('DOMContentLoaded', () => app.init());