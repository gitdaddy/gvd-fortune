CXX=g++
# compile in debug
# CPPFLAGS=-g
# -g -compile with debug symbols
RM=rm -f

# run- "make all" to compile gvd and gvd_test

all: target tests

target: gvd

tests: gvd_test

gvd:  types.o math.o nodeInsert.o utils.o dataset.o beachline.o main.o
	g++ -g -o gvd types.o math.o utils.o dataset.o main.o

gvd_test:  types.o math.o nodeInsert.o utils.o dataset.o beachline.o test.o
	g++ -g -o gvd_test types.o math.o utils.o dataset.o test.o

types.o: types.cc types.hh
	g++ -g -c types.cc

math.o: math.cc math.hh
	g++ -g -c math.cc

nodeInsert.o: nodeInsert.cc nodeInsert.hh
	g++ -g -c nodeInsert.cc

utils.o: utils.cc utils.hh
	g++ -g -c utils.cc

dataset.o: dataset.cc dataset.hh
	g++ -g -c dataset.cc

beachline.o: beachline.cc beachline.hh
	g++ -g -c beachline.cc

main.o: main.cc
	g++ -g -c main.cc

test.o: test.cc
	g++ -g -c test.cc

clean:
	$(RM) *.o *.gch