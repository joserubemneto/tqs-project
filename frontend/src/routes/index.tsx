import { createFileRoute } from '@tanstack/react-router'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
          UA Volunteering Platform
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto">
          Connect with volunteering opportunities at Universidade de Aveiro. Earn points, make an
          impact, and build community.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Discover Opportunities
              <Badge variant="success">New</Badge>
            </CardTitle>
            <CardDescription>
              Browse volunteering gigs that match your skills and interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="primary" className="w-full">
              Explore
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Track Your Impact</CardTitle>
            <CardDescription>
              See your contributions, earned points, and achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              View Dashboard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redeem Rewards</CardTitle>
            <CardDescription>Exchange your points for exclusive benefits and perks</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Browse Rewards
            </Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">Ready to make a difference?</h2>
        <div className="flex justify-center gap-4">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="ghost" size="lg">
            Learn More
          </Button>
        </div>
      </section>
    </div>
  )
}
