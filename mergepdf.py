#!/usr/bin/python
# -*- coding: utf-8 -*-

import PyPDF2 as pypdf
import sys
import getopt

def mergePDF(inpath, imgpath, outpath):
    inFile = open(inpath, "rb")
    # overlay = open(imgpath, "rb")
    with open(imgpath, "rb") as overlay:
        original = pypdf.PdfFileReader(inFile)
        background = original.getPage(0)
        foreground = pypdf.PdfFileReader(overlay).getPage(0)

        # merge the first two pages
        background.mergePage(foreground)

        # add all pages to a writer
        writer = pypdf.PdfFileWriter()
        for i in range(original.getNumPages()):
            page = original.getPage(i)
            writer.addPage(page)

        # write everything in the writer to a file
        with open(outpath, "wb") as outFile:
            writer.write(outFile)

def main(argv):
    inputfile = ''
    outputfile = ''
    markfile = ''
    try:
        opts, args = getopt.getopt(argv,"hi:m:o:",["in=", "mark=", "out="])
    except getopt.GetoptError:
        print 'test.py -i <inputfile> -o <outputfile>'
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print sys.argv[0], ' -i <inputfile> -o <outputfile>'
            sys.exit()
        elif opt in ("-i", "--in"):
            inputfile = arg
        elif opt in ("-m", "--mark"):
            markfile = arg
        elif opt in ("-o", "--out"):
            outputfile = arg
    # print inputfile, markfile, outputfile
    if inputfile and markfile and outputfile:
        mergePDF(inputfile, markfile, outputfile)
    else:
        print "arguments error."

if __name__ == "__main__":
    main(sys.argv[1:])


