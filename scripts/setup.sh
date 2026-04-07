#!/bin/bash

bun install

git clone https://github.com/effect-ts/effect-smol.git --depth 1 .repos/effect

git clone https://github.com/chakra-ui/chakra-ui.git --depth 1 .repos/chakra-ui

git clone https://github.com/TanStack/router.git --depth 1 .repos/tanstack-router

git clone https://github.com/TanStack/query.git --depth 1 .repos/tanstack-query

git clone https://github.com/TanStack/form.git --depth 1 .repos/tanstack-form

git clone https://github.com/TanStack/db.git --depth 1 .repos/tanstack-db
