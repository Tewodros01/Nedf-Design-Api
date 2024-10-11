import prisma from "../prisma/client";
import asyncHandler from "../middlewares/asyncHandler";
import ErrorResponse from "../utils/errorResponse";
import { errorTypes, resource404Error } from "../utils/errorObject";
import {
  checkRequiredFields,
  orderedQuery,
  selectedQuery,
} from "../utils/helperFunctions";
import { Prisma } from ".prisma/client";

/**
 * Get all categories
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getSwippers = asyncHandler(async (req, res, next) => {
  // Type Declaration
  type OrderType = { [key: string]: string };

  // Request Queries
  const querySelect = req.query.select;
  const queryOrder = req.query.order_by;

  // Filter and Sorting initial values
  let select: Prisma.CategorySelect | undefined = undefined;
  let orderBy: OrderType[] = [];

  // If select is sent along with request
  if (querySelect) {
    select = selectedQuery(querySelect as string);
  }

  // If order_by is sent along with request
  if (queryOrder) {
    orderBy = orderedQuery(queryOrder as string);
  }

  // Find categories with Prisma Client
  const swippers = await prisma.swiper.findMany({
    select,
    orderBy,
  });

  res
    .status(200)
    .json({ success: true, count: swippers.length, data: swippers });
});

/**
 * Get specific category
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
export const getSwipper = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);
  const querySelect = req.query.select;
  let select: Prisma.CategorySelect | undefined;

  // If select specific fields, response only selected query
  if (querySelect) {
    select = selectedQuery(querySelect as string);
  }

  const swipper = await prisma.swiper.findUnique({
    where: { id },
    select,
  });

  // Throws an error if swipper does not exists
  if (!swipper) {
    return next(new ErrorResponse(resource404Error("swipper"), 404));
  }

  res.status(200).json({
    success: true,
    data: swipper,
  });
});

/**
 * Create a new category
 * @route   POST /api/v1/categories
 * @access  Private (admin)
 */
export const createSwipper = asyncHandler(async (req, res, next) => {
  const queryName: string | undefined = req.body.name;
  const id: number | undefined = parseInt(req.body.id) || undefined;
  const filePthe: string | undefined = req.file?.filename;
  let name: string | undefined;

  // Throws an error if name field is not specified
  const hasError = checkRequiredFields({ name: queryName }, next);
  if (hasError !== false) return hasError;

  // Trim the name and change it to lower-case
  name = (queryName as string).trim().toLowerCase();

  // Create a category in prisma client
  const swipper = await prisma.swiper.create({
    data: {
      id: id as number,
      title: name as string,
      filePath:filePthe||'',
    },
  });

  res.status(201).json({
    success: true,
    location: `${req.protocol}://${req.get("host")}${req.baseUrl}/${
      swipper.id
    }`,
    data: swipper,
  });
});

/**
 * Delete a category
 * @route   DELETE /api/v1/categories/:id
 * @access  Private (admin)
 */
export const deleteSwipper = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id);

  await prisma.swiper.delete({
    where: { id },
  });

  res.status(204).json({
    success: true,
    data: [],
  });
});

/**
 * Update category
 * @route   PUT /api/v1/categories/:id
 * @access  Private
 */
export const updateSwipper = asyncHandler(async (req, res, next) => {
    const queryName: string | undefined = req.body.name;
    const id: number | undefined = parseInt(req.body.id) || undefined;
    const filePath: string | undefined = req.file?.filename;
    let title: string | undefined;

  const swiper = await prisma.swiper.update({
    where: { id },
    data: {
      title,
      filePath,
      updatedAt: new Date().toISOString(),
    },
  });

  res.status(200).json({
    success: true,
    data: swiper,
  });
});
