import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAIPerformance } from '../use-ai-performance'

const { insertMock, fromMock, createQueryBuilder } = vi.hoisted(() => {
  const insertMock = vi.fn()

  const createQueryBuilder = () => {
    const builder: Record<string, any> = {}

    builder.insert = insertMock
    builder.select = vi.fn(() => builder)
    builder.gte = vi.fn(() => builder)
    builder.order = vi.fn(() => builder)
    builder.eq = vi.fn(() => builder)
    builder.contains = vi.fn(() => builder)
    builder.then = (
      resolve: (value: any) => any,
      reject?: (reason?: any) => any
    ) => Promise.resolve({ data: [], error: null }).then(resolve, reject)

    return builder
  }

  const fromMock = vi.fn(() => createQueryBuilder())

  return { insertMock, fromMock, createQueryBuilder }
})

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock
  }
}))

describe('useAIPerformance', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    insertMock.mockReset()
    fromMock.mockReset()

    insertMock.mockResolvedValue({ data: null, error: null })
    fromMock.mockImplementation(() => createQueryBuilder())

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('logs an error when supabase insert returns an error', async () => {
    insertMock.mockResolvedValueOnce({ data: null, error: new Error('Insert failed') })

    const { result } = renderHook(() => useAIPerformance())

    await act(async () => {
      await result.current.recordMetric('test', 'failure_case', 1)
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to record performance metric:',
      expect.any(Error)
    )
  })
})
