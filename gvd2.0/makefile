CXX=g++
RM=rm -f

gvdExe: main.o dataset.o
	g++ -o gvdExe main.o dataset.o

main.o: main.cc
	g++ -c main.cc

dataset.o: dataset.cc dataset.hh
	g++ -c dataset.cc

clean:
	$(RM) *.o