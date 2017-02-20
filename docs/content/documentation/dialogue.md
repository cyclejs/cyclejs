# Dialogue abstraction

## Human-Computer Interaction

Cycle.js introduces a [message passing](https://en.wikipedia.org/wiki/Message_passing) architecture to model [Human-Computer Interaction (HCI)](https://en.wikipedia.org/wiki/Human%E2%80%93computer_interaction). While most Frontend frameworks focus on Graphical User Interfaces on the DOM, Cycle.js is more holistic and suitable when you need to create any kind of Human-Computer Interaction. This chapter provides some insights into how the Cycle.js architecture was devised. HCI is a two-way process: both sides listen and speak.

![simple human computer interaction](img/simple-human-computer.svg)

The computer usually "speaks" visual information through a screen, which the human can "listen". Through different devices, the computer can reach different human senses. The human, on the other hand, often "speaks" commands to the computer through its hand, manipulating a mouse or touching a screen.

Human-Computer Interaction is a dialogue: an ongoing exchange of messages between both sides.

Both parties are able to "listen" to each other, and utter messages through their devices. In other words, we can say the human and the computer are mutually observed, or simply having a dialogue. The reason why we point out "mutual observation" is because it is related to Reactive Programming and will affect how we model this system.

> ### Similarity with Haskell 1.0?
>
> This same dialogue concept can be found in [Haskell 1.0 Stream-based I/O](https://www.haskell.org/definition/haskell-report-1.0.ps.gz), where `type Dialogue = [Response] -> [Request]` is the model of interaction with the Operating System. `[Response]` is a stream (lazy potentially-infinite list, to be more accurate) of messages from the OS, and `[Request]` is a stream of messages to the OS.
>
> Cycle.js' abstraction was discovered independently from Haskell's Stream I/O. We try to take some inspiration from Haskell's `Dialogue` whenever convenient, but there are a few conceptual differences. Not all problems with Haskell's `Dialogue` exist in Cycle.js or matter to Cycle.js users, and vice-versa. This is due to different execution environment assumptions and different design decisions on modelling event streams. If you want more details on this topic, the following GOTO talk is recommended, centered around the history and theory behind Cycle.js:

<p>
  <iframe width="100%" height="360" src="https://www.youtube.com/embed/Tkjg179M-Nc" frameborder="0" allowfullscreen></iframe>
</p>

## Senses/actuators as I/O

The computer is made of devices to interact with the human. *Output* devices present information to the human, and *input* devices detect actions from the human. The human possesses *actuators* and *senses*, which are connected to the computer's *input* and *output* devices, respectively.

![actuators senses I/O](img/actuators-senses-input-output.svg)

The *inputs* and *outputs* of the computer suggest the computer's role in HCI can be expressed as a function. We do not yet know what `inputDevices` and `outputDevices` should be in JavaScript, but for now try to appreciate the elegance of `computer()` as a pure function.

```javascript
function computer(inputDevices) {
  // define the behavior of `outputDevices` somehow
  return outputDevices;
}
```

Refactoring and architecture can be just a matter of choosing the right composition of functions to make up `computer()`.

When talking about inputs, outputs, senses, and actuators, it becomes difficult to describe the difference between senses and inputs, other than the former is often associated with humans, and the latter with computers. From the computer's perspective, a microphone and its drivers are how the computer is able to *sense* auditory information. In essence, when we ignore the nature of the human body and the physics of computing machines, the human and the computer are both simply agents with senses and actuators.

```javascript
function computer(senses) {
  // define the behavior of `actuators` somehow
  return actuators;
}
```

The agents in this interaction are now **symmetric**: the actuator of one is connected to the senses of the other, and conversely.

![actuators senses](img/actuators-senses.svg)

The diagram above is an [anthropomorphism](https://en.wikipedia.org/wiki/Anthropomorphism) of the computer. If we take the opposite approach of objectifying humans as machines, then both human and computer would be functions with inputs and outputs.

![HCI Input Output](img/hci-inputs-outputs.svg)

Which suggests the human would be a function from its senses to its actuators.

```javascript
function human(senses) {
  // define the behavior of `actuators` somehow
  return actuators;
}
```

> Watch Andre Staltz's talk on **What if the user was a function?** which addresses the same topics as this chapter does.

<p>
  <iframe width="100%" height="360" src="https://www.youtube.com/embed/1zj7M1LnJV4" frameborder="0" allowfullscreen></iframe>
</p>

While these abstractions seem to be natural choices for user interfaces, many questions still remain:

- What are the types of `senses` and `actuators`?
- When is the `human()` function called?
- When is the `computer()` function called?
- If the output of one is the input of the other, how do we solve the circular dependency `y = human(x)` and `x = computer(y)`?

These are questions that drive the core architecture of Cycle.js, but to understand our solution, we first need to understand reactive streams: our building block for everything in Cycle.js. [Keep reading](streams.html).
