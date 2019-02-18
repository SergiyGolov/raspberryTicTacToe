#!/usr/bin/env python
# -*- coding: utf-8 -*-

from PIL import Image
from PIL import ImageDraw
import sys

from Adafruit_LED_Backpack import BicolorMatrix8x8

if __name__ == "__main__":

    display = BicolorMatrix8x8.BicolorMatrix8x8()

    display.begin()

    display.clear()

    image = Image.new('RGB', (8, 8))

    draw = ImageDraw.Draw(image)

    draw.line((2, 0, 2, 7), fill=(255, 255, 0))
    draw.line((5, 0, 5, 7), fill=(255, 255, 0))

    draw.line((0, 2, 7, 2), fill=(255, 255, 0))
    draw.line((0, 5, 7, 5), fill=(255, 255, 0))

    display.set_image(image)

    flatMatrix = list(sys.argv[1])

    x = 0
    y = 0

    for color in flatMatrix:

        if x == 3:
            y += 1
            x = 0

        if color == "g":
            c = BicolorMatrix8x8.GREEN
        elif color == "r":
            c = BicolorMatrix8x8.RED

        if color != "0":
            display.set_pixel(x*3, y*3, c)
            display.set_pixel(x*3+1, y*3, c)
            display.set_pixel(x*3, y*3+1, c)
            display.set_pixel(x*3+1, y*3+1, c)

        x += 1

    display.write_display()

