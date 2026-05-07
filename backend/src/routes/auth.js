const express = require('express');

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    message: 'Auth routes are mounted. Login/register are not implemented in this slice.',
  });
});

module.exports = router;
