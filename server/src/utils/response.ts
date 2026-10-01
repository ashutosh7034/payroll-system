export const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message
});

export const errorResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message }
});
