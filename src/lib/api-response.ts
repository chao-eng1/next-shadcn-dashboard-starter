import { NextResponse } from 'next/server';

interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string | null;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 创建统一的API成功响应
 * @param data 响应数据
 * @param message 响应消息
 * @param status 状态码
 * @returns NextResponse
 */
export function apiResponse<T>(
  data: T,
  message: string | null = null,
  status: number = 200
): NextResponse {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    message: message || null
  };

  return NextResponse.json(response, { status });
}

/**
 * 创建统一的API错误响应
 * @param code 错误代码
 * @param message 错误消息
 * @param details 错误详情
 * @param status 状态码
 * @returns NextResponse
 */
export function apiError(
  code: string,
  message: string,
  details?: any,
  status: number = 500
): NextResponse {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details
    }
  };

  return NextResponse.json(response, { status });
}

/**
 * 创建未授权错误响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function apiUnauthorized(message: string = '未授权访问'): NextResponse {
  return apiError('UNAUTHORIZED', message, null, 401);
}

/**
 * 创建禁止访问错误响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function apiForbidden(message: string = '禁止访问'): NextResponse {
  return apiError('FORBIDDEN', message, null, 403);
}

/**
 * 创建错误请求响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function apiBadRequest(message: string = '请求参数错误'): NextResponse {
  return apiError('BAD_REQUEST', message, null, 400);
}

/**
 * 创建资源不存在错误响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function apiNotFound(message: string = '资源不存在'): NextResponse {
  return apiError('NOT_FOUND', message, null, 404);
}

/**
 * 创建验证错误响应
 * @param errors 验证错误详情
 * @param message 错误消息
 * @returns NextResponse
 */
export function apiValidationError(errors: any, message: string = '请求参数验证失败'): NextResponse {
  return apiError('VALIDATION_ERROR', message, errors, 400);
}
