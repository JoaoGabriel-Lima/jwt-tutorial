const { verify } = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.ensureAuthenticated = async function (req, res, next) {
  // Get the token from the Authorization header
  const authToken = req.headers.authorization;

  // Return code 401 if no token is provided
  if (!authToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Slit the token to remove the "Bearer " part
  const token = authToken.split(" ")[1];

  // Verify the token and check if the user exists. Any error will return code 401
  try {
    // the user const contains a object with the userId
    const user = verify(token, process.env.JWT_SECRET);

    // Check if a user with this userId exists in the database.
    const isUserValid = await prisma.user.findUnique({
      where: { userId: user.userId },
    });
    if (!isUserValid) {
      return res.status(401).json({ message: "This Token is Invalid" });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: "This Token is Invalid" });
  }
};
