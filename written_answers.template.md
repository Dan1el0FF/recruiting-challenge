# Written answers — Daniel Sánchez Huerta

> **Write this yourself, without AI assistance.** Spell-check is fine. AI-drafted, AI-rewritten, or AI-polished written answers are an automatic decline — these questions exist specifically to measure how *you* think, write, and tell stories about your own past work.
>
> ~200 words per question. Past-tense, real systems. See `SUBMISSION.md`.

## Authorship declaration

I wrote these answers entirely without AI assistance. The only tool I used was spell-check.


> If English is not your first language, write in English anyway and don't worry about polish. We score substance and specificity, not grammar. Honest rough writing beats AI-laundered prose.

---

## Q1 — Production correctness validation

> Describe a system you owned where you had to add production correctness validation — alarms, contract tests, golden datasets, something that caught a class of bugs before users did. What did you do, what worked, what didn't, and what would you do differently?

> *Name the system. Name what you built. Name a specific bug it caught (or a specific gap it left).*


I worked on an automation project for Ford that involved developing an automated test bench for vehicle instrument panels before they were released to the market. The objective was to verify that all buttons, switches, and indicators functioned correctly by using a UR5e collaborative robot to interact with the dashboard in the same way a user would. The system had to operate in real time with high precision, ensuring reliable and repeatable test results while detecting defects before production.
One of my main responsibilities was designing a robust control system that could withstand electrical noise from the testing environment. I also developed a Human-Machine Interface (HMI) that allowed operators to monitor the testing process, record detected errors, and generate reports for quality analysis.
One challenge occurred when the robot occasionally failed to press certain buttons accurately because slight variations in the dashboard positioning caused alignment errors. This led to inconsistent test results and false failure reports. To solve the issue, I implemented a calibration routine that automatically adjusted the robot's reference position before each test cycle. I also optimized the robot's motion path and added software validation to confirm successful button activation. These improvements significantly increased the system's accuracy, reduced false alarms, and ensured consistent testing performance throughout the project.




## Q2 — Scaling-forced structural change

> Describe a system you've worked on where scaling — traffic, data volume, team size, or geography — forced a structural change to the code or architecture. What changed, who pushed back, and how did you decide?

> *Name the trigger metric. Name the change. Name the pushback and who it came from. Name the decision rule you applied.*

During the same proyect on Ford mentioned before, the system initially worked as expected, but as additional test sequences and validation routines were added, the execution time increased significantly. The trigger metric was the total test cycle time, which grew exponencially depending of the duration of the sequences.
To address this issue, I restructured the software architecture. Instead of loading every action each time I decided to load all actions once and called them using different input signals.
The main pushback came from another engineer, who believed the existing sequential design was easier to debug and maintain. He was concerned that making all actions in the same load would make harder to debug and it was right but also it was true that the process time would decrease so much. 
I based my decision on a simple performance rule: any architectural change had to reduce the total cycle time by at least 30% without affecting the reliability or accuracy of the tests. After benchmarking both implementations, the new architecture reduced the execution time by more than 40%, so it became the final solution for the project.



## Q3 — A time you rejected AI output (or accepted bad output and changed your process)

> Describe a specific moment in real work where you rejected AI output that you initially thought was correct, **or** accepted AI output that turned out to be wrong. Be concrete: what was the task, what was the output, what was the signal that flipped your judgment, and what did you do next? If the answer is "I accepted it and it shipped a bug," what did you change about your process so the class of mistake doesn't recur?

> *We are looking for one specific moment, not a philosophy of how you use AI. If you have not yet faced this in production work, write that honestly and describe the review process you've built for yourself instead — "strategies, not excuses" applies.*

When I was making a project to develop an Automated Guided Vehicle (AGV), I used AI to help generate the software logic for integrating the robot's sensors. One of the key components was an ultrasonic sensor used to detect obstacles and stop the AGV before a collision.

The AI suggested filtering the sensor readings by averaging multiple measurements over a relatively long time window to eliminate noise. Although the code looked correct, I realized that it did not account for the physical behavior of the robot. Because the AGV was moving continuously, the additional filtering introduced a delay of almost half a second before detecting an obstacle. At the robot's operating speed, that delay significantly increased the stopping distance and created a potential safety risk.

Instead of using the AI-generated solution, I redesigned the algorithm by using an ema filter with immediate validation for sudden distance changes. I then tested the system under different speeds and obstacle positions to verify its response time.

This experience taught me that AI can produce code that is syntactically correct and logically reasonable, but it does not always understand the physical constraints of real-world robotic systems. Since then, I always validate AI-generated solutions against the actual hardware requirements before integrating them into a project.



