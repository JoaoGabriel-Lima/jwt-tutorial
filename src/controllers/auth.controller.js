const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

// Importing GenerateToken module in our auth controller
const GenerateToken = require("../provider/GenerateTokenProvider");

// This function will check the user email and password in the database and will return status 200 if find a user.
exports.login = async function (req, res, next) {
  try {
    // Return code 401 if miss parameters
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "Missing parameters" });
    }

    // Return code 401 if not found a valid email or password
    let user = await prisma.user.findUnique({ where: { email } });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid || !user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token and return as response if login is valid
    const generateToken = new GenerateToken();
    const token = await generateToken.execute(user.userId);

    // Return 200 if email and password match with database info
    res.status(200).json({
      status: "OK",
      data: { AccessToken: token },
    });
  } catch (error) {
    next(error);
  }
};
