import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RewardFilters, type RewardFiltersState } from '@/components/reward/RewardFilters'

describe('RewardFilters', () => {
  const mockOnFiltersChange = vi.fn()

  beforeEach(() => {
    mockOnFiltersChange.mockClear()
  })

  describe('Search Input', () => {
    it('should render search input', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      expect(screen.getByTestId('reward-search')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search rewards...')).toBeInTheDocument()
    })

    it('should display current search value', () => {
      render(<RewardFilters filters={{ search: 'coffee' }} onFiltersChange={mockOnFiltersChange} />)
      
      expect(screen.getByTestId('reward-search')).toHaveValue('coffee')
    })

    it('should call onFiltersChange when search value changes', async () => {
      const user = userEvent.setup()
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      await user.type(screen.getByTestId('reward-search'), 'test')
      
      // It gets called for each character typed
      expect(mockOnFiltersChange).toHaveBeenCalledTimes(4) // t, e, s, t
      // Check last call includes the full search term
      const lastCall = mockOnFiltersChange.mock.calls[3][0]
      expect(lastCall.search).toContain('t')
    })

    it('should set search to undefined when cleared', async () => {
      const user = userEvent.setup()
      render(<RewardFilters filters={{ search: 'test' }} onFiltersChange={mockOnFiltersChange} />)
      
      await user.clear(screen.getByTestId('reward-search'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined })
      )
    })
  })

  describe('Filter Toggle', () => {
    it('should render filter toggle button', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      expect(screen.getByTestId('filter-toggle')).toBeInTheDocument()
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('should not show filters panel by default', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument()
    })

    it('should show filters panel when toggle is clicked', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument()
    })

    it('should hide filters panel when toggle is clicked again', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      expect(screen.getByTestId('filters-panel')).toBeInTheDocument()
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument()
    })

    it('should show active filters count on toggle button', () => {
      render(
        <RewardFilters
          filters={{ search: 'test', types: ['CERTIFICATE'], minPoints: 50 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      // Should show count of 3 active filters
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  describe('Type Filters', () => {
    it('should render all reward type filter buttons when expanded', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      
      expect(screen.getByTestId('type-filter-UA_SERVICE')).toBeInTheDocument()
      expect(screen.getByTestId('type-filter-PARTNER_VOUCHER')).toBeInTheDocument()
      expect(screen.getByTestId('type-filter-MERCHANDISE')).toBeInTheDocument()
      expect(screen.getByTestId('type-filter-CERTIFICATE')).toBeInTheDocument()
      expect(screen.getByTestId('type-filter-OTHER')).toBeInTheDocument()
    })

    it('should call onFiltersChange when type is selected', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      fireEvent.click(screen.getByTestId('type-filter-CERTIFICATE'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ types: ['CERTIFICATE'] })
      )
    })

    it('should add type to existing types when multiple selected', () => {
      render(
        <RewardFilters
          filters={{ types: ['CERTIFICATE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      fireEvent.click(screen.getByTestId('type-filter-MERCHANDISE'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          types: expect.arrayContaining(['CERTIFICATE', 'MERCHANDISE']),
        })
      )
    })

    it('should remove type when already selected type is clicked', () => {
      render(
        <RewardFilters
          filters={{ types: ['CERTIFICATE', 'MERCHANDISE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      fireEvent.click(screen.getByTestId('type-filter-CERTIFICATE'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ types: ['MERCHANDISE'] })
      )
    })

    it('should set types to undefined when last type is deselected', () => {
      render(
        <RewardFilters
          filters={{ types: ['CERTIFICATE'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      fireEvent.click(screen.getByTestId('type-filter-CERTIFICATE'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ types: undefined })
      )
    })
  })

  describe('Points Range Filters', () => {
    it('should render min and max points inputs when expanded', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      
      expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
      expect(screen.getByTestId('filter-max-points')).toBeInTheDocument()
    })

    it('should display current min points value', () => {
      render(
        <RewardFilters
          filters={{ minPoints: 50 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      
      expect(screen.getByTestId('filter-min-points')).toHaveValue(50)
    })

    it('should display current max points value', () => {
      render(
        <RewardFilters
          filters={{ maxPoints: 200 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      
      expect(screen.getByTestId('filter-max-points')).toHaveValue(200)
    })

    it('should call onFiltersChange when min points changes', async () => {
      const user = userEvent.setup()
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      await user.type(screen.getByTestId('filter-min-points'), '100')
      
      expect(mockOnFiltersChange).toHaveBeenCalled()
    })

    it('should call onFiltersChange when max points changes', async () => {
      const user = userEvent.setup()
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      await user.type(screen.getByTestId('filter-max-points'), '500')
      
      expect(mockOnFiltersChange).toHaveBeenCalled()
    })

    it('should set points to undefined when cleared', async () => {
      const user = userEvent.setup()
      render(
        <RewardFilters
          filters={{ minPoints: 50 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('filter-toggle'))
      await user.clear(screen.getByTestId('filter-min-points'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({ minPoints: undefined })
      )
    })
  })

  describe('Clear All Filters', () => {
    it('should not show clear all button when no filters active', () => {
      render(<RewardFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)
      
      expect(screen.queryByTestId('clear-all-filters')).not.toBeInTheDocument()
    })

    it('should show clear all button when filters are active', () => {
      render(
        <RewardFilters
          filters={{ search: 'test' }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByTestId('clear-all-filters')).toBeInTheDocument()
    })

    it('should clear all filters when clear all button is clicked', () => {
      render(
        <RewardFilters
          filters={{ search: 'test', types: ['CERTIFICATE'], minPoints: 50 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      fireEvent.click(screen.getByTestId('clear-all-filters'))
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })

  describe('Active Filters Count', () => {
    it('should count search as 1 active filter', () => {
      render(
        <RewardFilters
          filters={{ search: 'test' }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should count types as 1 active filter regardless of how many selected', () => {
      render(
        <RewardFilters
          filters={{ types: ['CERTIFICATE', 'MERCHANDISE', 'OTHER'] }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should count minPoints as 1 active filter', () => {
      render(
        <RewardFilters
          filters={{ minPoints: 50 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should count maxPoints as 1 active filter', () => {
      render(
        <RewardFilters
          filters={{ maxPoints: 500 }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should correctly count all active filters', () => {
      render(
        <RewardFilters
          filters={{
            search: 'test',
            types: ['CERTIFICATE'],
            minPoints: 50,
            maxPoints: 500,
          }}
          onFiltersChange={mockOnFiltersChange}
        />
      )
      
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })
})
