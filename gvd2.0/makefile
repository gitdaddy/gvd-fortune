CXX=g++
RM=rm -f

gvdExe: main.o dataset.o math.o types.o
	g++ -o gvdExe main.o dataset.o

main.o: main.cc
	g++ -c main.cc

dataset.o: dataset.cc dataset.hh
	g++ -c dataset.cc

math.o: math.cc math.hh
	g++ -c math.cc

types.o: types.hh
	g++ -c types.hh

clean:
	$(RM) *.o