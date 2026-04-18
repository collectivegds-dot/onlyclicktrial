const app = require('../backend/server.js');

module.exports = (req, res) => {
  // Add any Vercel-specific logic here if needed
  return app(req, res);
};
