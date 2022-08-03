const { verify } = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = function checkPermission(permittedRoles) {
  return async (req, res, next) => {
    if (!req.headers.authorization) {
      return res
        .status(500)
        .json({ message: "Authenticate system was ignored" });
    }
    const token = req.headers.authorization.split(" ")[1];
    const usertokeninfo = verify(token, process.env.JWT_SECRET);
    const id = usertokeninfo.userId;
    const user = await prisma.user.findUnique({
      where: { userId: String(id) },
    });

    if (user) {
      if (permittedRoles.includes(user.permissions)) {
        req.role = user.permissions;
        req.userId = user.userId;
        next();
      } else {
        return res.status(401).json({
          message: "You are not authorized to perform this action",
        });
      }
    } else {
      return res.status(400).json({
        message: "This user is invalid or does not exist",
      });
    }
  };
};
