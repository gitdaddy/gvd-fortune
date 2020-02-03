CXX=g++
# compile in debug
# CPPFLAGS=-g
# -g -compile with debug symbols
RM=rm -f

gvdExe:  types.o math.o dataset.o main.o
	g++ -g -o gvdExe types.o math.o dataset.o main.o

types.o: types.cc types.hh
	g++ -g -c types.cc

math.o: math.cc math.hh
	g++ -g -c math.cc

dataset.o: dataset.cc dataset.hh
	g++ -g -c dataset.cc

main.o: main.cc
	g++ -g -c main.cc

clean:
	$(RM) *.o *.gch