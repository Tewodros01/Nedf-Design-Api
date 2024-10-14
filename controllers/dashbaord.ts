import { PrismaClient, Prisma } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'
import asyncHandler from "../middlewares/asyncHandler"

const prisma = new PrismaClient()

interface ProductCategory {
  categoryId: number
  categoryName: string
  productCount: number
}

interface DashboardData {
  productStats: {
    totalProductPrice: Prisma.Decimal | null
    numberOfProducts: number
  }
  numberOfCustomers: number
  numberOfCategories: number
  productsByCategory: ProductCategory[]
}

/**
 * Get dashboard data
 * @route   GET /api/v1/dashboard
 * @access  Private (superadmin)
 */
export const dashboard = asyncHandler(async (req, res) => {
  try {
    const [productStats, customerCount, productsByCategory] = await prisma.$transaction([
      // 1. Get product stats
      prisma.product.aggregate({
        _sum: { price: true },
        _count: { _all: true },
      }),

      // 2. Get customer count
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),

      // 3. Get products by category
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          products: {
            select: {
              id: true,
            },
          },
        },
      }),
    ])

    const formattedProductsByCategory: ProductCategory[] = productsByCategory.map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      productCount: category.products.length,
    }))

    const dashboardData: DashboardData = {
      productStats: {
        totalProductPrice: productStats._sum.price,
        numberOfProducts: productStats._count._all,
      },
      numberOfCustomers: customerCount,
      numberOfCategories: formattedProductsByCategory.length,
      productsByCategory: formattedProductsByCategory,
    }

    res.status(200).json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error('Dashboard data fetch error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(400).json({
        success: false,
        message: 'Database error',
        error: error.message,
      })
    } else {
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
      })
    }
  }
})