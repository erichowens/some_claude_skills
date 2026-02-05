'use client';

import { useState } from 'react';
import { Sparkles, Code, Cpu, Folder, FileText, Settings } from 'lucide-react';

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Stack,
  Flex,
} from '@/components/ui';

export default function HomePage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="win31-desktop p-8">
      {/* Header Window */}
      <Card variant="win31" className="mx-auto mb-8 max-w-4xl">
        <CardHeader variant="win31">
          <Sparkles className="h-4 w-4" />
          <CardTitle variant="win31">SOME CLAUDE SKILLS</CardTitle>
        </CardHeader>
        <CardContent variant="win31" className="text-center">
          <h1 className="mb-4 font-display text-2xl text-win31-navy">
            Expert AI Agents for Specialized Tasks
          </h1>
          <p className="mb-6 font-body text-win31-black">
            90+ curated Claude Code skills. Windows 3.1 aesthetic. Modern architecture.
          </p>
          <Flex gap="4" justify="center" wrap="wrap">
            <Button variant="win31" size="win31-default">
              <Folder className="mr-2 h-4 w-4" />
              Browse Skills
            </Button>
            <Button variant="win31-primary" size="win31-default">
              <Code className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </Flex>
        </CardContent>
      </Card>

      {/* Feature Grid */}
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <Card variant="win31">
          <CardHeader variant="win31">
            <FileText className="h-4 w-4" />
            <CardTitle variant="win31">SKILLS.EXE</CardTitle>
          </CardHeader>
          <CardContent variant="win31">
            <Stack gap="2">
              <p className="font-body text-sm">
                90+ expert skills covering development, design, DevOps, and more.
              </p>
              <ul className="list-inside list-disc font-body text-sm">
                <li>TypeScript Developer</li>
                <li>System Architect</li>
                <li>DevOps Engineer</li>
              </ul>
            </Stack>
          </CardContent>
          <CardFooter variant="win31">
            <Button variant="win31" size="win31-sm">
              Open
            </Button>
          </CardFooter>
        </Card>

        {/* Card 2 */}
        <Card variant="win31">
          <CardHeader variant="win31">
            <Cpu className="h-4 w-4" />
            <CardTitle variant="win31">MCP.DLL</CardTitle>
          </CardHeader>
          <CardContent variant="win31">
            <Stack gap="2">
              <p className="font-body text-sm">
                Model Context Protocol servers for extended capabilities.
              </p>
              <ul className="list-inside list-disc font-body text-sm">
                <li>Skill Registry</li>
                <li>Prompt Learning</li>
                <li>CV Creator</li>
              </ul>
            </Stack>
          </CardContent>
          <CardFooter variant="win31">
            <Button variant="win31" size="win31-sm">
              Open
            </Button>
          </CardFooter>
        </Card>

        {/* Card 3 - Dialog Demo */}
        <Card variant="win31">
          <CardHeader variant="win31">
            <Settings className="h-4 w-4" />
            <CardTitle variant="win31">DIALOG.EXE</CardTitle>
          </CardHeader>
          <CardContent variant="win31">
            <Stack gap="2">
              <p className="font-body text-sm">
                Try the Win31-styled dialog component built on Radix UI.
              </p>
            </Stack>
          </CardContent>
          <CardFooter variant="win31">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="win31" size="win31-sm">
                  Open Dialog
                </Button>
              </DialogTrigger>
              <DialogContent variant="win31">
                <DialogHeader variant="win31">
                  <DialogTitle variant="win31" icon="📄">
                    README.TXT
                  </DialogTitle>
                </DialogHeader>
                <div className="p-4 font-body text-sm">
                  <p className="mb-4">
                    This is a Win31-styled dialog built on Radix UI primitives.
                  </p>
                  <p className="mb-4">
                    It handles accessibility, focus trapping, and keyboard navigation automatically.
                  </p>
                  <p className="text-win31-dark-gray">
                    Press ESC or click outside to close.
                  </p>
                </div>
                <DialogFooter variant="win31">
                  <Button
                    variant="win31"
                    size="win31-sm"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    OK
                  </Button>
                  <Button
                    variant="win31"
                    size="win31-sm"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </div>

      {/* Footer */}
      <Card variant="win31" className="mx-auto mt-8 max-w-4xl">
        <CardContent variant="win31" className="py-3 text-center">
          <p className="font-system text-xs text-win31-dark-gray">
            Made by Erich Owens | Ex-Meta ML Engineer | Next.js + Tailwind v4 + Cloudflare Pages
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
