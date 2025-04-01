# Compiler and flags
CXX = clang++
CXXFLAGS = -std=c++17 -Wall -O2

# Name of the output executable
TARGET = server

# Default target
all: $(TARGET)

$(TARGET): main.cpp
	$(CXX) $(CXXFLAGS) -o $(TARGET) main.cpp

clean:
	rm -f $(TARGET)
