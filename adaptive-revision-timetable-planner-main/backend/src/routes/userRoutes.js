const express = require('express');
const rateLimit = require('express-rate-limit');
const requireAuth = require('../middleware/authMiddleware');
const supabaseAdmin = require('../supabaseClient');

const router = express.Router();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});

router.use(apiLimiter);

// GET /api/me - "get current user" endpoint, returns auth info + profile row
router.get('/me', requireAuth, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({
    id: req.user.id,
    email: req.user.email,
    display_name: profile?.display_name || null,
    created_at: profile?.created_at || null,
  });
});

module.exports = router;
