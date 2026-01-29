import { fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OpportunityFilters as Filters } from '@/lib/opportunity'
import type { SkillResponse } from '@/lib/profile'
import { render, screen, waitFor } from '@/test/test-utils'

// Mock the profile API for skills
const mockGetSkills = vi.fn()

vi.mock('@/lib/profile', async () => {
  const actual = await vi.importActual('@/lib/profile')
  return {
    ...actual,
    getSkills: () => mockGetSkills(),
  }
})

// Import after mocks are set up
import { OpportunityFilters } from '@/components/opportunity/OpportunityFilters'

const mockSkills: SkillResponse[] = [
  { id: 1, name: 'Communication', category: 'COMMUNICATION', description: 'Communication skills' },
  { id: 2, name: 'Leadership', category: 'LEADERSHIP', description: 'Leadership skills' },
  { id: 3, name: 'Programming', category: 'TECHNICAL', description: 'Programming skills' },
  { id: 4, name: 'Teamwork', category: 'COMMUNICATION', description: 'Teamwork skills' },
]

describe('OpportunityFilters', () => {
  const mockOnFiltersChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSkills.mockResolvedValue(mockSkills)
  })

  describe('Initial Rendering', () => {
    it('should render filter toggle button', async () => {
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      expect(screen.getByTestId('filter-toggle')).toBeInTheDocument()
      expect(screen.getByText('Filters')).toBeInTheDocument()
    })

    it('should not show filters panel initially', async () => {
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument()
    })

    it('should not show clear all button when no filters are active', async () => {
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      expect(screen.queryByTestId('clear-all-filters')).not.toBeInTheDocument()
    })

    it('should not show active filter count badge when no filters', async () => {
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      const filterToggle = screen.getByTestId('filter-toggle')
      expect(filterToggle).not.toHaveTextContent(/^\d+$/)
    })
  })

  describe('Filter Toggle', () => {
    it('should expand filters panel when clicking toggle button', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filters-panel')).toBeInTheDocument()
      })
    })

    it('should collapse filters panel when clicking toggle button again', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      // Expand
      await user.click(screen.getByTestId('filter-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('filters-panel')).toBeInTheDocument()
      })

      // Collapse
      await user.click(screen.getByTestId('filter-toggle'))
      await waitFor(() => {
        expect(screen.queryByTestId('filters-panel')).not.toBeInTheDocument()
      })
    })
  })

  describe('Skills Filter', () => {
    it('should display skills grouped by category', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByText('Filter by Skills')).toBeInTheDocument()
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
        expect(screen.getByTestId('skill-filter-2')).toBeInTheDocument()
        expect(screen.getByTestId('skill-filter-3')).toBeInTheDocument()
      })
    })

    it('should show skill names as buttons', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        // Use getByTestId to get the skill buttons specifically
        expect(screen.getByTestId('skill-filter-1')).toHaveTextContent('Communication')
        expect(screen.getByTestId('skill-filter-2')).toHaveTextContent('Leadership')
        expect(screen.getByTestId('skill-filter-3')).toHaveTextContent('Programming')
      })
    })

    it('should call onFiltersChange when selecting a skill', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-1'))

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skillIds: [1],
      })
    })

    it('should call onFiltersChange when deselecting a skill', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = { skillIds: [1] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-1'))

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skillIds: undefined,
      })
    })

    it('should highlight selected skills', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = { skillIds: [1, 2] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-1')).toHaveClass('bg-primary-500')
        expect(screen.getByTestId('skill-filter-2')).toHaveClass('bg-primary-500')
        expect(screen.getByTestId('skill-filter-3')).not.toHaveClass('bg-primary-500')
      })
    })

    it('should allow selecting multiple skills', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = { skillIds: [1] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('skill-filter-2')).toBeInTheDocument()
      })

      await user.click(screen.getByTestId('skill-filter-2'))

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        skillIds: [1, 2],
      })
    })

    it('should show loading message when skills are loading', async () => {
      const user = userEvent.setup()
      // Return a never-resolving promise to simulate loading
      mockGetSkills.mockReturnValue(new Promise(() => {}))

      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      expect(screen.getByText('Loading skills...')).toBeInTheDocument()
    })
  })

  describe('Date Filters', () => {
    it('should display date filter inputs', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-from')).toBeInTheDocument()
        expect(screen.getByTestId('filter-start-date-to')).toBeInTheDocument()
      })
    })

    it('should display date labels', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByText('Start Date From')).toBeInTheDocument()
        expect(screen.getByText('Start Date To')).toBeInTheDocument()
      })
    })

    it('should call onFiltersChange when setting start date from', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-from')).toBeInTheDocument()
      })

      const dateInput = screen.getByTestId('filter-start-date-from')
      await user.type(dateInput, '2024-02-01')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        startDateFrom: '2024-02-01T00:00:00',
      })
    })

    it('should call onFiltersChange when setting start date to', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-to')).toBeInTheDocument()
      })

      const dateInput = screen.getByTestId('filter-start-date-to')
      await user.type(dateInput, '2024-03-01')

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        startDateTo: '2024-03-01T00:00:00',
      })
    })

    it('should display current date filter values', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = {
        startDateFrom: '2024-02-01T00:00:00',
        startDateTo: '2024-03-01T00:00:00',
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-from')).toHaveValue('2024-02-01')
        expect(screen.getByTestId('filter-start-date-to')).toHaveValue('2024-03-01')
      })
    })

    it('should clear date filter when input is cleared', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = {
        startDateFrom: '2024-02-01T00:00:00',
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-start-date-from')).toBeInTheDocument()
      })

      const dateInput = screen.getByTestId('filter-start-date-from')
      await user.clear(dateInput)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        startDateFrom: undefined,
      })
    })
  })

  describe('Points Filters', () => {
    it('should display points filter inputs', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
        expect(screen.getByTestId('filter-max-points')).toBeInTheDocument()
      })
    })

    it('should display points labels', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByText('Minimum Points')).toBeInTheDocument()
        expect(screen.getByText('Maximum Points')).toBeInTheDocument()
      })
    })

    it('should call onFiltersChange when setting min points', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
      })

      const pointsInput = screen.getByTestId('filter-min-points')
      // Use fireEvent.change to set the complete value at once (controlled component)
      fireEvent.change(pointsInput, { target: { value: '50' } })

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minPoints: 50,
      })
    })

    it('should call onFiltersChange when setting max points', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-max-points')).toBeInTheDocument()
      })

      const pointsInput = screen.getByTestId('filter-max-points')
      // Use fireEvent.change to set the complete value at once (controlled component)
      fireEvent.change(pointsInput, { target: { value: '200' } })

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        maxPoints: 200,
      })
    })

    it('should display current points filter values', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = {
        minPoints: 50,
        maxPoints: 200,
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toHaveValue(50)
        expect(screen.getByTestId('filter-max-points')).toHaveValue(200)
      })
    })

    it('should clear points filter when input is cleared', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = {
        minPoints: 50,
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        expect(screen.getByTestId('filter-min-points')).toBeInTheDocument()
      })

      const pointsInput = screen.getByTestId('filter-min-points')
      await user.clear(pointsInput)

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        minPoints: undefined,
      })
    })
  })

  describe('Active Filters Count', () => {
    it('should show count badge when one filter is active', async () => {
      const initialFilters: Filters = { skillIds: [1] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      const filterToggle = screen.getByTestId('filter-toggle')
      expect(filterToggle).toHaveTextContent('1')
    })

    it('should show count badge when multiple filters are active', async () => {
      const initialFilters: Filters = {
        skillIds: [1, 2],
        minPoints: 50,
        maxPoints: 200,
        startDateFrom: '2024-02-01T00:00:00',
        startDateTo: '2024-03-01T00:00:00',
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      const filterToggle = screen.getByTestId('filter-toggle')
      // Skills count as 1 filter, plus 4 other filters = 5
      expect(filterToggle).toHaveTextContent('5')
    })

    it('should count skillIds as one filter regardless of how many are selected', async () => {
      const initialFilters: Filters = { skillIds: [1, 2, 3] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      const filterToggle = screen.getByTestId('filter-toggle')
      expect(filterToggle).toHaveTextContent('1')
    })
  })

  describe('Clear All Filters', () => {
    it('should show clear all button when filters are active', async () => {
      const initialFilters: Filters = { skillIds: [1] }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      expect(screen.getByTestId('clear-all-filters')).toBeInTheDocument()
    })

    it('should call onFiltersChange with empty object when clicking clear all', async () => {
      const user = userEvent.setup()
      const initialFilters: Filters = {
        skillIds: [1, 2],
        minPoints: 50,
        startDateFrom: '2024-02-01T00:00:00',
      }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('clear-all-filters'))

      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })

    it('should display Clear All text', async () => {
      const initialFilters: Filters = { minPoints: 50 }
      render(<OpportunityFilters filters={initialFilters} onFiltersChange={mockOnFiltersChange} />)

      expect(screen.getByText('Clear All')).toBeInTheDocument()
    })
  })

  describe('Category Labels', () => {
    it('should display category labels for skills', async () => {
      const user = userEvent.setup()
      render(<OpportunityFilters filters={{}} onFiltersChange={mockOnFiltersChange} />)

      await user.click(screen.getByTestId('filter-toggle'))

      await waitFor(() => {
        // Check for category labels using getAllBy since skill names may match category names
        // The category labels appear as text in <p> elements with specific class
        const categoryLabels = screen.getAllByText(/Communication|Leadership|Technical/)
        expect(categoryLabels.length).toBeGreaterThanOrEqual(3)
      })
    })
  })
})
