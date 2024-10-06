import asyncHandler from "../middlewares/asyncHandler";
import prisma from "../prisma/client";
import { resource404Error } from "../utils/errorObject";
import ErrorResponse from "../utils/errorResponse";

/**
 * Get all users
 * @route   GET /api/v1/users
 * @access  Private
 */
export const getusers = asyncHandler(async (req, res, next) => {
  const users = await prisma.user.findMany({
    where: {
      role: {
        not: 'ADMIN',
      },
    },
    // prisma desn't provide exclude yet, thus I have to
    // specify these fields to exclude some fields like password. sucks!
    select: {
      id: true,
      fullname: true,
      email: true,
      shippingAddress: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * Get specific user
 * @route   GET /api/v1/users/:id
 * @access  Private
 */
export const getuser = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullname: true,
      email: true,
      shippingAddress: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Throws 404 error if user not found
  if (!user) {
    return next(new ErrorResponse(resource404Error("user"), 404));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * Delete user
 * @route   DEETE /api/v1/users/:id
 * @access  Private
 */
export const deleteuser = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);

  await prisma.user.delete({
    where: { id },
  });

  res.status(204).json({
    success: true,
    data: [],
  });
});
