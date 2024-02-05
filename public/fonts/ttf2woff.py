# https://stackoverflow.com/questions/60049960/fonttools-convert-ttf-to-woff2
from fontTools.ttLib import TTFont
f = TTFont("Dekko-Regular.ttf")
f.flavor = "woff2"
f.save("Dekko-Regular.woff2")
f.flavor = "woff"
f.save("Dekko-Regular.woff")
