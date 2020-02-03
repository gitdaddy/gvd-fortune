CXX=g++
RM=rm -f

gvdExe:  types.o math.o dataset.o main.o
	g++ -o gvdExe types.o math.o dataset.o main.o

types.o: types.cc types.hh
	g++ -c types.cc

math.o: math.cc math.hh
	g++ -c math.cc

dataset.o: dataset.cc dataset.hh
	g++ -c dataset.cc

main.o: main.cc
	g++ -c main.cc

clean:
	$(RM) *.o *.gch