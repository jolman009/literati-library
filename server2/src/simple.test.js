describe('Basic Server Test Setup', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have test environment', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should have Node.js environment', () => {
    expect(typeof process).toBe('object')
    expect(typeof global).toBe('object')
  })
})