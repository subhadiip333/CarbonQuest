import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100)
});

export const createActivitySchema = z.object({
  description: z.string().min(1, 'Activity description is required').max(500)
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000)
});

export const generateQuestsSchema = z.object({
  weather: z.string().optional(),
  lifestyle: z.string().optional()
});

export const optimizeRouteSchema = z.object({
  origin: z.string().min(1, 'Origin is required'),
  destination: z.string().min(1, 'Destination is required')
});

export const redeemItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required')
});
