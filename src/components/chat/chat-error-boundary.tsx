'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatErrorBoundaryProps, ChatErrorBoundaryState } from '@/types/chat';

export class ChatErrorBoundary extends Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<ChatErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 记录错误到控制台
    console.error('Chat Error Boundary caught an error:', error, errorInfo);

    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    this.props.onRetry?.();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 自定义错误UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // 默认错误UI
      return (
        <div className='flex h-full flex-col items-center justify-center bg-gray-50 p-8'>
          <div className='max-w-md text-center'>
            <AlertTriangle className='mx-auto mb-4 h-16 w-16 text-red-500' />

            <h2 className='mb-2 text-xl font-semibold text-gray-900'>
              聊天功能出现错误
            </h2>

            <p className='mb-6 text-gray-600'>
              抱歉，聊天功能遇到了一些问题。请尝试重新加载或刷新页面。
            </p>

            {/* 错误详情 (仅在开发环境显示) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='mb-6 text-left'>
                <summary className='cursor-pointer text-sm text-gray-500 hover:text-gray-700'>
                  查看错误详情
                </summary>
                <div className='mt-2 max-h-32 overflow-auto rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700'>
                  <div className='font-mono'>
                    <div className='mb-1 font-semibold'>错误信息:</div>
                    <div className='mb-2'>{this.state.error.message}</div>

                    <div className='mb-1 font-semibold'>错误堆栈:</div>
                    <pre className='whitespace-pre-wrap'>
                      {this.state.error.stack}
                    </pre>

                    {this.state.errorInfo && (
                      <>
                        <div className='mt-2 mb-1 font-semibold'>组件堆栈:</div>
                        <pre className='whitespace-pre-wrap'>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              </details>
            )}

            <div className='flex flex-col justify-center gap-3 sm:flex-row'>
              <Button
                onClick={this.handleRetry}
                className='flex items-center space-x-2'
              >
                <RefreshCw size={16} />
                <span>重试</span>
              </Button>

              <Button
                variant='outline'
                onClick={this.handleRefresh}
                className='flex items-center space-x-2'
              >
                <Home size={16} />
                <span>刷新页面</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
