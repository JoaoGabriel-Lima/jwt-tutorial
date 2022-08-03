var jwt = require("jsonwebtoken");

// * This class is responsible for creating and returning a new encoded and signed access token with user userID.

class GenerateToken {
  async execute(userId) {
    const token = jwt.sign({ userId: userId }, `${process.env.JWT_SECRET}`, {
      expiresIn: "15m",
    });
    return token;
  }
}

module.exports = GenerateToken;
