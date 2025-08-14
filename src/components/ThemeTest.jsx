import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export default function ThemeTest() {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Theme Test Page</h1>
          <Button onClick={toggleTheme} variant="outline">
            Toggle Theme
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Background Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-background border rounded">bg-background</div>
              <div className="p-4 bg-card border rounded">bg-card</div>
              <div className="p-4 bg-muted border rounded">bg-muted</div>
              <div className="p-4 bg-accent border rounded">bg-accent</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Text Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-foreground">text-foreground</div>
              <div className="text-muted-foreground">text-muted-foreground</div>
              <div className="text-card-foreground">text-card-foreground</div>
              <div className="text-accent-foreground">text-accent-foreground</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="default">Default Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Borders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border border-border rounded">border-border</div>
              <div className="p-4 border border-input rounded">border-input</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
