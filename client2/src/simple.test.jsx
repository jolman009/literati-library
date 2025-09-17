import React from 'react';
import { describe, it, expect, vi } from 'vitest'

describe('Basic Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have access to vi mocking', () => {
    const mockFn = vi.fn()
    mockFn()
    expect(mockFn).toHaveBeenCalled()
  })
})