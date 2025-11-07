# Overview
As a software engineer in the health tech space, I've always had an interest in pharmacokinetics. I've done a lot of work with insulin medications and creating applications around the administration/monitoring of these medications.

After I fractured my foot, I had to take some narcotic medication and I was really worried about mixing my medications and having adverse side effects with my ADHD meds. So I created this script that calculates the half life of various medications that can cause respiratory depression or may be dangerous to mix with other mediciations.

It's easy to estimate how much a mediciation is going to last when you know the half life and you take a single dose, but it gets tricky when you have overlapping doses of long acting medications.

I don't have a lot of python code in my GitHub so I took a break from Node.JS!

## Long term plans
Eventually, I'd like to create a front-end for this and convert the python code into an API using something lightweight like flask. For now, it's just a python script with hard coded data points.

## Version
This was developed using Python 3, `3.13.0`.

# Usage
1) `brew install pyenv`
2) `echo "eval \"$(pyenv init --path)\" >> ~/.zshrc`
3) `brew install 3.13.0`
4) `brew global 3.13.0`
5) `source ~/.zshrc`
6) `cd <this dir>`
7) `pip install -r requirements.txt`
8) `source calculate.py`
