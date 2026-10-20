#!/usr/bin/env bash
set -e

mkdir -p native/cpp_calc/build
cd native/cpp_calc/build
cmake ..
make -j$(nproc)
echo "C++ library built successfully"
