"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlternativeSuccessMessage } from "@/components/ui/alternative-success-message"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function SuccessMessageDemo() {
  const [showMessage, setShowMessage] = useState(false)
  const [animationStyle, setAnimationStyle] = useState<"fade" | "slide" | "scale" | "bounce">("fade")
  const [icon, setIcon] = useState<"check" | "thumbs-up" | "award">("check")

  const handleShowMessage = () => {
    setShowMessage(true)
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Success Message Animation Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Animation Settings</CardTitle>
            <CardDescription>Customize the success message animation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="animation-style">Animation Style</Label>
              <Select value={animationStyle} onValueChange={(value) => setAnimationStyle(value as any)}>
                <SelectTrigger id="animation-style">
                  <SelectValue placeholder="Select animation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide from Top</SelectItem>
                  <SelectItem value="scale">Scale Up</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon-type">Icon Type</Label>
              <Select value={icon} onValueChange={(value) => setIcon(value as any)}>
                <SelectTrigger id="icon-type">
                  <SelectValue placeholder="Select icon type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check">Check Circle</SelectItem>
                  <SelectItem value="thumbs-up">Thumbs Up</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleShowMessage} className="w-full">
              Show Success Message
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Click the button to preview the animation</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center">
            <div className="text-center text-gray-500">Success message will appear centered on the screen</div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-gray-500">
              Current settings: <span className="font-medium">{animationStyle}</span> animation with{" "}
              <span className="font-medium">{icon}</span> icon
            </div>
          </CardFooter>
        </Card>
      </div>

      <AlternativeSuccessMessage
        message="Operation Successful!"
        subMessage="Your action has been completed successfully."
        visible={showMessage}
        duration={3000}
        onClose={() => setShowMessage(false)}
        animationStyle={animationStyle}
        icon={icon}
      />
    </div>
  )
}
