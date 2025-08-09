'use client';

import React from 'react';
import { ChatInterface } from '@/components/chat';
import { Toaster } from 'sonner';

export default function ChatDemoPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      {/* 页面标题 */}
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-8 text-center'>
          <h1 className='mb-4 text-4xl font-bold text-gray-900'>
            AI对话助手演示
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-gray-600'>
            体验我们的AI对话功能，支持桌面端浮动窗口和移动端全屏界面。
            点击右下角的聊天按钮开始对话。
          </p>
        </div>

        {/* 功能介绍 */}
        <div className='mx-auto grid max-w-4xl gap-6 md:grid-cols-3'>
          <div className='rounded-lg bg-white p-6 shadow-md'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100'>
              <svg
                className='h-6 w-6 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>
              智能对话
            </h3>
            <p className='text-gray-600'>
              与AI助手进行自然对话，获得智能回复和帮助。
            </p>
          </div>

          <div className='rounded-lg bg-white p-6 shadow-md'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100'>
              <svg
                className='h-6 w-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>
              移动适配
            </h3>
            <p className='text-gray-600'>
              完美适配移动设备，提供流畅的触屏体验。
            </p>
          </div>

          <div className='rounded-lg bg-white p-6 shadow-md'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100'>
              <svg
                className='h-6 w-6 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 10V3L4 14h7v7l9-11h-7z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>
              实时连接
            </h3>
            <p className='text-gray-600'>
              基于WebSocket的实时通信，消息即时送达。
            </p>
          </div>
        </div>

        {/* 使用说明 */}
        <div className='mx-auto mt-8 max-w-2xl rounded-lg bg-white p-6 shadow-md'>
          <h3 className='mb-4 text-lg font-semibold text-gray-900'>使用说明</h3>
          <ul className='space-y-2 text-gray-600'>
            <li className='flex items-start space-x-2'>
              <span className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500'></span>
              <span>点击右下角的聊天图标打开对话窗口</span>
            </li>
            <li className='flex items-start space-x-2'>
              <span className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500'></span>
              <span>在桌面端可以拖拽和调整窗口大小</span>
            </li>
            <li className='flex items-start space-x-2'>
              <span className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500'></span>
              <span>移动端支持手势关闭和侧边栏导航</span>
            </li>
            <li className='flex items-start space-x-2'>
              <span className='mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500'></span>
              <span>支持文本消息和文件附件</span>
            </li>
          </ul>
        </div>
      </div>

      {/* AI对话界面 */}
      <ChatInterface
        triggerPosition={{ x: 20, y: 20 }}
        windowPosition={{ x: 100, y: 100 }}
        windowSize={{ width: 380, height: 580 }}
        enableMobile={true}
        enableWebSocket={false} // 演示模式下禁用WebSocket
      />

      {/* Toast通知 */}
      <Toaster position='top-right' richColors />
    </div>
  );
}
