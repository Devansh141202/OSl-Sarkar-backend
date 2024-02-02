from PIL import Image
import sys
import base64
from io import BytesIO

img = Image.open(sys.argv[1] + '/' + sys.argv[2])
img = img.convert("L")
img = img.save(sys.argv[2]+"b&w.png")
with open(sys.argv[2]+"b&w.png", "rb") as f:
    
    
    im_b64 = base64.b64encode(f.read())

# print(im_b64.decode('utf-8'))