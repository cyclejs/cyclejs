This document explains how work around the Cycle.js core team is organized, so everyone is on the same page, and we avoid misunderstandings.

# What does the core team do?

- They take important decisions on the direction the framework is taking
- They review or approve pull requests
- They regularly contribute with code to the framework
- They label GitHub issues with appropriate scope, priority, and type
- They are part of the [Cycle.js Open Collective](http://opencollective.com/cyclejs) with transparent usage of funds

# Who comprise the core team of Cycle.js?

https://github.com/orgs/cyclejs/people

- Andre Staltz [@staltz](https://github.com/staltz)
- Nick Johnstone [@Widdershin](https://github.com/Widdershin)
- Jan Van Brügge [@jvanbruegge](https://github.com/jvanbruegge)

**Previously:**

- Tylor Steinberger [@TylorS](https://github.com/TylorS) (left due to lack of time to invest in Cycle.js)
- Frederik Krautwald [@Frikki](https://github.com/Frikki)

# How does the core team collaborate?

There is a Gitter channel only for the core team, where they discuss next steps and ideas. This channel is private not because of secrecy, but to focus the conversation, since the main Cycle.js gitter chat is usually crowded with multiple discussions. Most of the important discussions within the core team happen anyway in Github issues.

The previous core team members still have access to the core team chat room.

# Code of conduct

The general [Code of conduct](https://github.com/cyclejs/cyclejs/blob/master/CODE-OF-CONDUCT.md) applies to everyone in the Cycle.js community. In addition, with core team members you should expect:

- They have genuine intentions in helping people even if their messages are curt or straight to the point
- As a core team member, try to look for a useful insight behind *anyone's* comment
  - If they are frustrated, what is the pain point of frustration? If they are asking for solution X, what is their problem Y behind that problem? And so forth
- A smiley makes any message easier to digest :)

# Instructions for using Open Collective funds

As a core team member, you can receive some funds per hour of open source contribution to Cycle.js.

**Setting up:**

- You will need a PayPal account
- @staltz will add you to the Open Collective group
- Agree your hourly rate with the core team
- Stay in contact with the Open Collective administrators to sort out the paperwork, if any
- More at https://opencollective.com/faq

**Sending an expense:**

- Choose an issue marked [**should**](https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22priority+3+%28should%29%22) or [**must**](https://github.com/cyclejs/cyclejs/issues?q=is%3Aissue+is%3Aopen+label%3A%22priority+4+%28must%29%22)
  - We don't think issues marked **could** or **maybe** should be funded
- Assign yourself to that issue so that other people don't do redundant work on it too
- Work on it and track your hours as you go
- Send an invoice PDF to [Open Collective Cycle.js](https://opencollective.com/cyclejs) mentioning those hours and your PayPal account
- Don't invoice an amount larger than the *weekly limit* (read about it below)
- Mention it as "Worked `_` hours on issues #123, #456, #789"

**Weekly limit:**

The maximum you should invoice **per week** is `total_funds_now / amount_of_core_team_members`. For instance, if the Open Collective funds are at the moment 900 USD, then the maximum you can invoice this week is 300 USD (divide this by your hourly rate and you can see how many hours is possible). The reason behind this rule is that it gives all core team members the same possibilities of invoicing, and avoids conflicts (otherwise, if there are 900 USD funds, and two people both invoice 500 USD, one of these will lack 100 USD). Open Collective pays the expenses only weekly, this is why this rule is per week. You can send multiple expenses per week, but they will be all paid as one bundle. We recommend making at most just one expense per week, combining hours worked on multiple issues.

# How to become a core team member

The core team discusses between themselves:

- Whether the current team size is good or should grow
- Whether there is need for more maintenance
- Whether Open Collective funds could reasonably support the whole team
- Who in the community has been contributing often with PRs, and displaying a helpful behavior in the community

So if you are interested in becoming a core team member, just get involved with the framework by contributing with PRs, docs, Gitter chat assistance. Note that this might not be enough given the other criteria above not related to people in the community.

# Purpose

Create a framework for user interfaces where code is easily visualizable, written in a consistent style, easy to test, easy to trace and follow its execution, easy to compose.
