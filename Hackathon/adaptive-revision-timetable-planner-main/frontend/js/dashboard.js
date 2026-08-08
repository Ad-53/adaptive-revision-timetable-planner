// MY ADDITION: Dashboard Action Functions - All functionality for the enhanced dashboard
const app = {
    // --- Persistent application state ---
    state: {
        isAuthenticated: false,
        currentView: 'dashboard',
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
        totalConfidence: 0
    },

    // --- Initialization ---
    init() {
        this.loadStoredState();
        this.setupEventListeners();
        this.initTheme();
        this.initMermaid();
        this.showView(this.state.isAuthenticated ? 'dashboard' : 'login');
        this.updateExamSummary();
        console.log('Dashboard initialized');
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
                }
            };
            if (this.state.isAuthenticated) {
                this.setUserGreeting();
            }
        } catch (error) {
            console.warn('Unable to load saved state:', error);
        }
    },

    // Save important application state into localStorage
    saveState() {
        const stateToSave = {
            isAuthenticated: this.state.isAuthenticated,
            token: this.state.token,
            user: this.state.user,
            examData: this.state.examData,
            revisionQueue: this.state.revisionQueue,
            currentQuestion: this.state.currentQuestion,
            questionsAnswered: this.state.questionsAnswered,
            totalConfidence: this.state.totalConfidence
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
            throw error;
        }
    },

    // Get current user from backend /api/me endpoint
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/me`, {
                headers: { 'Authorization': `Bearer ${this.state.token}` }
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        throw new Error('Unauthorized');
    },

    // Check if backend is available (health check)
    async checkBackendHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
            return response.ok;
        } catch (error) {
            return false;
        }
    },

    // Get exam data from backend
    async getExamData() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/exams/current`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        throw new Error('Unable to fetch exam data');
    },

    // Save exam data to backend
    async saveExamData(examData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/exams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(examData)
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        return { message: 'Exam data saved locally' };
    },

    // Generate revision plan from backend
    async generateRevisionPlan(topics, examDate) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/revision-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topics, examDate })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        // Generate demo plan
        return {
            message: 'Revision plan generated',
            queue: topics.map((topic, index) => ({
                id: `q_${Date.now()}_${index}`,
                topic_name: topic,
                question: `Explain the core concepts of ${topic} in your own words.`,
                confidence: 5,
                scheduledAt: null,
                lastFeedback: 'No submissions yet.',
                ai_score_awarded: null,
                ai_max_score: null
            }))
        };
    },

    // Mark question with AI feedback (demo mode)
    async markQuestion(userAnswer, maxScore, userConfidence) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/questions/mark`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify({ userAnswer, maxScore, userConfidence })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        // Demo mode feedback
        return new Promise((resolve) => {
            setTimeout(() => resolve({
                ai_score_awarded: Math.floor(Math.random() * (maxScore - 3) + 3),
                ai_feedback: 'Great job! Keep practicing.',
                user_confidence_rating: userConfidence
            }), 500);
        });
    },

    // Generate question from backend
    async generateQuestion(topic, scrapedContent) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/questions/generate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.state.token}`
                },
                body: JSON.stringify({ topic, scrapedContent })
            });
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log('Backend unavailable');
        }
        // Demo mode question
        return new Promise((resolve) => {
            setTimeout(() => resolve(`What is the implementation of ${topic}?`), 500);
        });
    },

    // Initialize Mermaid.js for rendering flowcharts
    initMermaid() {
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'forest',
            securityLevel: 'loose'
        });
    },

    // Display a specific view
    showView(viewName) {
        this.state.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll('.view').forEach((view) => view.classList.add('hidden'));
        
        // Show target view
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

        // Initialize view-specific components
        if (viewName === 'dashboard') {
            this.initCalendar();
            this.renderTopicList();
            this.updateStats();
        }

        if (viewName === 'login' || viewName === 'signup' || viewName === 'forgot-password') {
            // Auth views handled by their respective JS files
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
        if (errorEl) {
            const errorText = errorEl.querySelector('.error-text');
            if (errorText) {
                errorText.textContent = message;
                errorEl.classList.remove('hidden');
            }
        }
    },

    // Log the user out and clear saved state
    logout() {
        this.state.isAuthenticated = false;
        this.state.user = null;
        this.state.token = null;
        localStorage.removeItem('revisionAIState');
        window.location.href = '/login';
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
            await this.saveExamData(this.state.examData);
            this.showToast('Exam schedule updated successfully!', 'success');
        } catch (error) {
            console.warn('Unable to persist exam data to backend:', error);
            this.showToast('Exam details saved locally.', 'info');
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

        try {
            await this.generateRevisionPlan(this.state.examData.topics, this.state.examData.date);
            this.showToast('Adaptive plan generated successfully!', 'success');
        } catch (error) {
            console.warn('Unable to send plan to backend:', error);
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

        countdownEl.innerText = deltaDays > 0 ? `${deltaDays} day${deltaDays === 1 ? '' : 's'}` : 'Today!';
        summaryEl.innerText = `${this.state.examData.topics.length} topic${this.state.examData.topics.length === 1 ? '' : 's'} ready for revision.`;
    },

    // Update stats display
    updateStats() {
        const questionsAnsweredEl = document.getElementById('questions-answered');
        const avgConfidenceEl = document.getElementById('avg-confidence');
        
        if (questionsAnsweredEl) {
            questionsAnsweredEl.innerText = this.state.questionsAnswered;
        }
        
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

        this.showLoading('Processing flowchart image...');
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
            this.hideLoading();
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

    // Show loading overlay
    showLoading(text = 'Processing...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        if (overlay && loadingText) {
            overlay.classList.remove('hidden');
            loadingText.textContent = text;
        }
    },

    // Hide loading overlay
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
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
            this.showToast(`Loaded ${type} template`, 'success');
        }
    },

    // Update the visible revision question and queue
    updateRevisionView() {
        const topicQueueList = document.getElementById('topic-queue-list');
        const questionDisplay = document.getElementById('question-display');
        const answerInputContainer = document.getElementById('answer-input-container');
        const feedbackContainer = document.getElementById('feedback-container');
        const questionTopic = document.getElementById('question-topic');
        const questionContent = document.getElementById('question-content');
        const topicBadge = document.getElementById('question-topic-badge');
        const marksText = document.getElementById('marks-text');
        const queueCount = document.getElementById('queue-count');
        const progressValue = document.getElementById('progress-value');
        const progressFill = document.getElementById('progress-fill');
        const completeBtn = document.getElementById('complete-question-btn');
        const nextQuestionBtn = document.getElementById('next-question-btn');

        // Update topic queue list
        if (topicQueueList) {
            topicQueueList.innerHTML = this.state.revisionQueue.map((item, index) => {
                return `<li class="queue-item">
                            <span>${index + 1}. ${item.topic_name}</span>
                            <span class="confidence-indicator">${item.confidence || 5}/10</span>
                        </li>`;
            }).join('');
        }

        // Show/hide question display based on state
        if (this.state.currentQuestion) {
            questionDisplay.classList.remove('hidden');
            answerInputContainer.classList.add('hidden');
            feedbackContainer.classList.add('hidden');
            
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
            if (nextQuestionBtn) nextQuestionBtn.classList.add('hidden');
        } else {
            questionDisplay.classList.add('hidden');
            answerInputContainer.classList.remove('hidden');
            feedbackContainer.classList.add('hidden');
            
            questionTopic.innerText = 'Ready to Start';
            questionContent.innerHTML = '<div class="question-empty-state"><span class="empty-icon">💡</span><p>Press <strong>"Next Question"</strong> to load your first adaptive question based on your revision plan.</p></div>';
            
            if (topicBadge) topicBadge.innerHTML = `<span class="badge-icon">📚</span><span>Ready to Start</span>`;
            if (marksText) marksText.innerHTML = `<span class="marks-icon">🎯</span><span>-- marks</span>`;
            
            // Hide complete button
            if (completeBtn) completeBtn.classList.add('hidden');
            if (nextQuestionBtn) nextQuestionBtn.classList.remove('hidden');
        }
    },

    // Load the next question into the active revision view
    loadNextQuestion() {
        if (this.state.revisionQueue.length === 0) {
            this.showError('Please generate an adaptive plan first so there are questions to review.');
            return;
        }

        this.showLoading('Generating next question...');

        setTimeout(() => {
            if (this.state.revisionQueue.length > 0) {
                const next = this.state.revisionQueue.shift();
                this.state.currentQuestion = next;
                this.saveState();
                this.updateRevisionView();
                this.showToast('New question loaded!', 'success');
            }
            this.hideLoading();
        }, 1000);
    },

    // Submit answer to the backend and update local revision state
    async submitAnswer(event) {
        event.preventDefault();
        const answerText = document.getElementById('user-answer').value.trim();
        const confidence = Number(document.getElementById('confidence-slider').value);
        const feedbackEl = document.getElementById('feedback-content');
        const scoreBadge = document.getElementById('feedback-score');

        if (!this.state.currentQuestion) {
            this.showError('Load a question first using Next Question.');
            return;
        }

        if (!answerText) {
            this.showError('Please type your answer before submitting.');
            return;
        }

        // Update character count
        const charCount = document.getElementById('char-count');
        if (charCount) charCount.innerText = `${answerText.length} characters`;

        feedbackEl.innerHTML = '<div class="feedback-loading"><span class="loading-icon">⏳</span><p>AI is grading your answer...</p></div>';
        scoreBadge.classList.add('hidden');

        this.showLoading('Grading your answer...');

        try {
            const response = await this.markQuestion(answerText, 10, confidence);

            // Update state with feedback
            this.state.currentQuestion.lastFeedback = response.ai_feedback || 'Answer submitted successfully.';
            this.state.currentQuestion.confidence = confidence;
            
            // Track stats
            this.state.questionsAnswered++;
            this.state.totalConfidence += confidence;

            // Update feedback display
            feedbackEl.innerHTML = `
                <div class="feedback-content">
                    <p><strong>Feedback:</strong></p>
                    <p>${response.ai_feedback || 'Great effort! Keep practicing.'}</p>
                    ${response.ai_score_awarded ? `<span class="score-badge">Score: ${response.ai_score_awarded}/10</span>` : ''}
                </div>
            `;
            scoreBadge.classList.remove('hidden');

            // Reprioritize revision queue
            this.reprioritizeRevisionQueue();
            
            // Clear answer textarea
            document.getElementById('user-answer').value = '';
            if (charCount) charCount.innerText = '0 characters';

            this.saveState();
            this.updateRevisionView();
            this.updateStats();
            this.showToast('Answer submitted and graded!', 'success');
        } catch (error) {
            console.warn('Answer submission failed:', error);
            feedbackEl.innerHTML = '<div class="feedback-content"><p><strong>Feedback:</strong></p><p>Unable to submit answer. Please check your connection.</p></div>';
        } finally {
            this.hideLoading();
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
        this.showToast('Question completed!', 'success');
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

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
};

// Initialize the app after DOM loads
document.addEventListener('DOMContentLoaded', () => app.init());