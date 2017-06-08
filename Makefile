.PHONY: lint docs dom history html http isolate jsonp most-run run rxjs-run

BINDIR=node_modules/.bin
TSLINT=$(BINDIR)/tslint
TSC=$(BINDIR)/tsc
MOCHA=$(BINDIR)/mocha
BROWSERIFY=$(BINDIR)/browserify
BUMP=$(BINDIR)/bump
JASE=$(BINDIR)/jase
TESTEM=$(BINDIR)/testem

ARG=$(filter-out $@,$(MAKECMDGOALS))

help :
	@echo "Available commands in the Cycle.js monorepo:"
	@echo ""
	@echo "  make setup\t\t\tyarn install everything"
	@echo "  make commit\t\t\tgit commit following our format"
	@echo "  make lint <package>\t\tlint just <package> (e.g. 'make lint dom')"
	@echo "  make lib <package>\t\tcompile just <package> (e.g. 'make lib dom')"
	@echo "  make lib all\t\t\tcompile all packages"
	@echo "  make test\t\t\ttest everything"
	@echo "  make test <package>\t\ttest just <package>"
	@echo "  make test-ci\t\t\ttest everything for continuous integration"
	@echo "  make test-ci <package>\ttest just <package> for CI"
	@echo "  make dist <package>\t\tbuild dist for <package> only"
	@echo "  make docs\t\t\tbuild the whole docs website"
	@echo "  make docs <package>\t\tbuild the docs for <package> only"
	@echo "  make changelog <package>\tupdate changelog file for <package> only"
	@echo "  make check-release\t\treport what versions should we release next"
	@echo "  make release-all\t\trelease exactly what 'make check-release' reported"
	@echo "  make release-minor <package>\trelease a new minor version of <package>"
	@echo "  make release-major <package>\trelease a new major version of <package>"
	@echo ""

setup :
	@echo "(root): yarn install"
	@yarn install
	@echo ""
	@while read d ; do \
		echo "$$d: yarn install" ;\
		cd $$d ; yarn install ; cd .. ;\
		echo "" ;\
	done < .scripts/RELEASABLE_PACKAGES
	@make lib all

prettier-all :
	@echo "Formatting all source files using prettier"
	@while read d ; do \
		$(BINDIR)/prettier --write \
		--single-quote --no-bracket-spacing --trailing-comma=all \
		"$$d/{src,test}/**/*.ts" ;\
	done < .scripts/RELEASABLE_PACKAGES

commit :
	.scripts/commit.sh

lint :
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make lint' with an argument, like 'make lint dom'" ;\
	else \
		$(TSLINT) --config tslint.json --project $(ARG)/tsconfig.json &&\
		echo "✓ Passed lint" ;\
	fi

lib :
	@if [ "$(ARG)" = "all" ]; then \
		while read d ; do \
			echo "Compiling $$d" ; \
			make lib $$d ; \
		done < .scripts/RELEASABLE_PACKAGES; \
	elif [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make lib' with an argument, like 'make lib dom' 'make lib all'" ;\
	else \
		rm -rf $(ARG)/lib/ ;\
		mkdir -p $(ARG)/lib ;\
		$(TSC) --project $(ARG) ;\
		echo "✓ Compiled TypeScript to lib" ;\
	fi

# Example: `make docs dom`
docs :
	@if [ "$(ARG)" = "" ]; then \
		make docs-all ;\
	else \
		node .scripts/make-api-docs.js $(ARG) ;\
		echo "✓ Docs for $(ARG)" ;\
	fi

docs-index :
	node ./docs/.scripts/make-index.js

docs-documentation :
	node ./docs/.scripts/make-documentation.js

docs-releases :
	node ./docs/.scripts/make-releases.js

docs-api :
	node ./docs/.scripts/make-api-index.js
	@while read d ; do make docs $$d ; echo "" ; done < .scripts/RELEASABLE_PACKAGES

docs-all : docs-index docs-documentation docs-releases docs-api

changelog :
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make changelog' with an argument, like 'make changelog dom'" ;\
	else \
		node .scripts/update-changelogs.js $(ARG) ;\
		echo "✓ Updated changelog for $(ARG)" ;\
	fi

dist :
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make dist' with an argument, like 'make dist dom'" ;\
	else \
		rm -rf $(ARG)/dist ;\
		mkdir -p $(ARG)/dist/ ;\
		make lib $(ARG) ;\
		cd $(ARG) ; npm run browserify ; npm run minify ; cd .. ;\
		echo "✓ Built dist for $(ARG)" ;\
	fi

test :
	@if [ "$(ARG)" = "" ]; then \
		make test-all ;\
	else \
		make lib $(ARG) &&\
		cd $(ARG) && npm run test && cd .. &&\
		make lint $(ARG) &&\
		echo "✓ Tested $(ARG)" ;\
	fi

test-ci :
	@if [ "$(ARG)" = "" ]; then \
		make setup &&\
		make test-ci-all ;\
	else \
		make lib $(ARG) &&\
		cd $(ARG) && npm run test-ci && cd .. &&\
		make lint $(ARG) &&\
		echo "✓ Tested CI $(ARG)" ;\
	fi

test-all :
	.scripts/test-all.sh

test-ci-all :
	.scripts/test-ci-all.sh

check-release :
	.scripts/pre-check-release.sh

release-all :
	.scripts/release-whatever-needs-release.sh

prebump :
	make test $(ARG)

postbump :
	make dist $(ARG)
	make docs $(ARG)
	make changelog $(ARG)
	git add -A
	git commit -m "release($(ARG)): $(shell cat $(ARG)/package.json | $(JASE) version)"
	git push origin master
	cd $(ARG) ; npm publish ; cd ..

release-minor :
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make release-minor' with an argument, like 'make release-minor dom'" ;\
	else \
		make prebump $(ARG) ;\
		$(BUMP) $(ARG)/package.json --quiet --minor ;\
		make postbump $(ARG) ;\
		echo "✓ Released new minor for $(ARG)" ;\
	fi

release-major :
	@if [ "$(ARG)" = "" ]; then \
		echo "Error: please call 'make release-major' with an argument, like 'make release-major dom'" ;\
	else \
		make prebump $(ARG) ;\
		$(BUMP) $(ARG)/package.json --quiet --major ;\
		make postbump $(ARG) ;\
		echo "✓ Released new major for $(ARG)" ;\
	fi

# catch anything and do nothing
dom :
	@:
history :
	@:
html :
	@:
http :
	@:
isolate :
	@:
jsonp :
	@:
most-run :
	@:
run :
	@:
rxjs-run :
	@:
%:
	@:
.DEFAULT :
	@:
