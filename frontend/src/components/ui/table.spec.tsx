import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './table'

describe('Table Components', () => {
  describe('Table', () => {
    it('renders table element', () => {
      render(
        <Table data-testid="table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>,
      )

      expect(screen.getByTestId('table')).toBeInTheDocument()
      expect(screen.getByTestId('table').tagName).toBe('TABLE')
    })

    it('wraps table in scrollable container', () => {
      render(
        <Table data-testid="table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>,
      )

      const table = screen.getByTestId('table')
      const wrapper = table.parentElement
      expect(wrapper).toHaveClass('overflow-auto')
    })

    it('applies custom className', () => {
      render(
        <Table className="custom-table" data-testid="table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>,
      )

      expect(screen.getByTestId('table')).toHaveClass('custom-table')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableElement>()

      render(
        <Table ref={ref}>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableElement)
    })

    it('applies base styles', () => {
      render(
        <Table data-testid="table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>,
      )

      expect(screen.getByTestId('table')).toHaveClass('w-full', 'text-sm')
    })
  })

  describe('TableHeader', () => {
    it('renders thead element', () => {
      render(
        <table>
          <TableHeader data-testid="header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>,
      )

      expect(screen.getByTestId('header').tagName).toBe('THEAD')
    })

    it('applies custom className', () => {
      render(
        <table>
          <TableHeader className="custom-header" data-testid="header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>,
      )

      expect(screen.getByTestId('header')).toHaveClass('custom-header')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableSectionElement>()

      render(
        <table>
          <TableHeader ref={ref}>
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement)
    })
  })

  describe('TableBody', () => {
    it('renders tbody element', () => {
      render(
        <table>
          <TableBody data-testid="body">
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>,
      )

      expect(screen.getByTestId('body').tagName).toBe('TBODY')
    })

    it('applies custom className', () => {
      render(
        <table>
          <TableBody className="custom-body" data-testid="body">
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>,
      )

      expect(screen.getByTestId('body')).toHaveClass('custom-body')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableSectionElement>()

      render(
        <table>
          <TableBody ref={ref}>
            <tr>
              <td>Cell</td>
            </tr>
          </TableBody>
        </table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableSectionElement)
    })
  })

  describe('TableRow', () => {
    it('renders tr element', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      )

      expect(screen.getByTestId('row').tagName).toBe('TR')
    })

    it('applies hover and border styles', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      )

      const row = screen.getByTestId('row')
      expect(row).toHaveClass('border-b', 'transition-colors')
    })

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <TableRow className="custom-row" data-testid="row">
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      )

      expect(screen.getByTestId('row')).toHaveClass('custom-row')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableRowElement>()

      render(
        <table>
          <tbody>
            <TableRow ref={ref}>
              <td>Cell</td>
            </TableRow>
          </tbody>
        </table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableRowElement)
    })
  })

  describe('TableHead', () => {
    it('renders th element', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="head">Header</TableHead>
            </tr>
          </thead>
        </table>,
      )

      expect(screen.getByTestId('head').tagName).toBe('TH')
    })

    it('applies base styles', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="head">Header</TableHead>
            </tr>
          </thead>
        </table>,
      )

      const head = screen.getByTestId('head')
      expect(head).toHaveClass('h-12', 'px-4', 'font-medium')
    })

    it('applies custom className', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead className="custom-head" data-testid="head">
                Header
              </TableHead>
            </tr>
          </thead>
        </table>,
      )

      expect(screen.getByTestId('head')).toHaveClass('custom-head')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableCellElement>()

      render(
        <table>
          <thead>
            <tr>
              <TableHead ref={ref}>Header</TableHead>
            </tr>
          </thead>
        </table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableCellElement)
    })
  })

  describe('TableCell', () => {
    it('renders td element', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="cell">Cell</TableCell>
            </tr>
          </tbody>
        </table>,
      )

      expect(screen.getByTestId('cell').tagName).toBe('TD')
    })

    it('applies base styles', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="cell">Cell</TableCell>
            </tr>
          </tbody>
        </table>,
      )

      const cell = screen.getByTestId('cell')
      expect(cell).toHaveClass('p-4', 'align-middle')
    })

    it('applies custom className', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell className="custom-cell" data-testid="cell">
                Cell
              </TableCell>
            </tr>
          </tbody>
        </table>,
      )

      expect(screen.getByTestId('cell')).toHaveClass('custom-cell')
    })

    it('forwards ref correctly', () => {
      const ref = createRef<HTMLTableCellElement>()

      render(
        <table>
          <tbody>
            <tr>
              <TableCell ref={ref}>Cell</TableCell>
            </tr>
          </tbody>
        </table>,
      )

      expect(ref.current).toBeInstanceOf(HTMLTableCellElement)
    })
  })

  describe('integration', () => {
    it('renders complete table structure correctly', () => {
      render(
        <Table data-testid="table">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Doe</TableCell>
              <TableCell>jane@example.com</TableCell>
            </TableRow>
          </TableBody>
        </Table>,
      )

      // Check table structure
      expect(screen.getByTestId('table')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })
  })
})
