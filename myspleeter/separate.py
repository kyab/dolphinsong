from spleeter.separator import Separator
from bottle import route, run, template
import os

separator = Separator('spleeter:5stems')
count = 0

@route("/hello/<name>")
def hello(name):
    global count
    count += 1
    return "hello " + name + str(count)

@route("/separate/<filename>")
def separate(filename):
    global separator
    infile = "../data/sounds/" + filename
    out = "../data/sounds/stems/" + os.path.splitext(filename)[0]
    print("separating:" + infile + " to " + out)
    separator.separate_to_file(infile, out)
    return "done : " + filename

run(host = "localhost", port=8080)

# separator.separate_to_file("./winter.mp3", "./output")
# separator.separate_to_file("./winter.mp3", "./output")