#!/usr/bin/python3

# Generates a graph of systems for a Diaspora RPG cluster.
#
# Command-line args are system names, separated by spaces.
#
# Exmaple:
#     cluster-gen.py A B C D E F > our-cluster.dot
#     neato -Tpdf -oour-cluster.pdf our-cluster.dot

import random
import sys

TECH_COLOR        = {"red":0, "green":0, "blue":1}
ENVIRONMENT_COLOR = {"red":0, "green":1, "blue":0}
RESOURCE_COLOR    = {"red":1, "green":0, "blue":0}

def fudgeThrow():
    """Throw 4d3-8, essentially.  Four fudge dice."""
    throw = 0
    for i in range(4):
        throw += random.randrange(-1,2)
    return throw

def nodeColor_Subtractive( techThrow, envThrow, resThrow):
    """Returns the background color a node should have, using a different algorithm than that of nodeColor_Additive."""
    techColor = {"red":1, "green":1, "blue":0}
    envColor  = {"red":0, "green":0, "blue":1}
    resColor  = {"red":1, "green":0, "blue":0}

    techness = (techThrow + 4)/8
    envness = (envThrow + 4)/8
    resness = (resThrow + 4)/8
    # print("\t\tDEBUG: techness = {0}, envness = {1}, resness = {2}".format( techness, envness, resness), file=sys.stderr)

    r = g = b = 1

    i = 0
    for aspect in [[techness, techColor], [envness, envColor], [resness, resColor]]:
        r = r - (1 - aspect[0]) * aspect[1]["red"]
        g = g - (1 - aspect[0]) * aspect[1]["green"]
        b = b - (1 - aspect[0]) * aspect[1]["blue"]
        # print("\t\tDEBUG: after aspect {0}, (r, g, b) = ({1}, {2}, {3})".format(i, r, g, b), file=sys.stderr)
        i = i + 1

    # Fix problem where we might have taken too much off.
    mr = mg = mb = 0                    # Max. red, green, blue, if a system is T4 E4 R4.
    for c in [techColor, envColor, resColor]:
        mr = mr + c["red"]
        mg = mg + c["green"]
        mb = mb + c["blue"]
    m = max( mr, mg, mb)                # m is the most we could have taken from 1.  Need to make this zero.

    r = (r + (m - 1)) / m               # m = 2 ==> [-1,1] --> [0,2] --> [0,1]
    g = (g + (m - 1)) / m
    b = (b + (m - 1)) / m

    # print("\tDEBUG: T{0} E{1} R{2} ==> color({3}, {4}, {5})".format( techThrow, envThrow, resThrow, r, g, b),file=sys.stderr)

    # Make hex RGB color
    base = 127
    r = int( base + (255 - base) * r)
    g = int( base + (255 - base) * g)
    b = int( base + (255 - base) * b)

    retval = "#{0:02x}{1:02x}{2:02x}".format( r, g, b)

    return retval

def nodeColor_Additive(techThrow, envThrow, resThrow):
    """Returns the background color a node should have."""

    techness = (techThrow + 4)/8
    envness = (envThrow + 4)/8
    resness = (resThrow + 4)/8
    
    r = g = b = 0

    for aspect in [[techness, TECH_COLOR], [envness, ENVIRONMENT_COLOR], [resness, RESOURCE_COLOR]]:
        r = r + aspect[0] * aspect[1]["red"]
        g = g + aspect[0] * aspect[1]["green"]
        b = b + aspect[0] * aspect[1]["blue"]

    # Scale back to interval [0,1]
    m = 1 # max(r,g,b)     # Max. it could possibly be, given the static color setup above.
    mr = mg = mb = 0                    # Max. red, green, blue, if a system is T4 E4 R4.
    for c in [TECH_COLOR, ENVIRONMENT_COLOR, RESOURCE_COLOR]:
        mr = mr + c["red"]
        mg = mg + c["green"]
        mb = mb + c["blue"]
    m = max( mr, mg, mb)
    r = r / m
    g = g / m
    b = b / m

    # print("\tDEBUG: T{0} E{1} R{2} ==> color({3}, {4}, {5})".format( techThrow, envThrow, resThrow, r, g, b),file=sys.stderr)

    # Make hex RGB color
    base = 127 - 32
    r = int( base + (255 - base) * r)
    g = int( base + (255 - base) * g)
    b = int( base + (255 - base) * b)

    retval = "#{0:02x}{1:02x}{2:02x}".format( r, g, b)

    return retval

def nodeColor_Additive2(techThrow, envThrow, resThrow):
    """Returns the background color a node should have."""
    techColor = {"red":1, "green":1, "blue":0}
    envColor  = {"red":0, "green":0, "blue":1}
    resColor  = {"red":1, "green":0, "blue":0}

    techness = (techThrow + 4)/8
    envness = (envThrow + 4)/8
    resness = (resThrow + 4)/8
    
    r = g = b = 0

    for aspect in [[techness, techColor], [envness, envColor], [resness, resColor]]:
        r = r + aspect[0] * aspect[1]["red"]
        g = g + aspect[0] * aspect[1]["green"]
        b = b + aspect[0] * aspect[1]["blue"]

    # Scale back to interval [0,1]
    m = 1 # max(r,g,b)     # Max. it could possibly be, given the static color setup above.
    mr = mg = mb = 0                    # Max. red, green, blue, if a system is T4 E4 R4.
    for c in [techColor, envColor, resColor]:
        mr = mr + c["red"]
        mg = mg + c["green"]
        mb = mb + c["blue"]
    m = max( mr, mg, mb)                # m is the max. that could have been added.

    r = min( r, 1)
    g = min( g, 1)
    b = min( b, 1)

    # print("\tDEBUG: T{0} E{1} R{2} ==> color({3}, {4}, {5})".format( techThrow, envThrow, resThrow, r, g, b),file=sys.stderr)

    # Make hex RGB color
    base = 127 + 32
    r = int( base + (255 - base) * r)
    g = int( base + (255 - base) * g)
    b = int( base + (255 - base) * b)

    retval = "#{0:02x}{1:02x}{2:02x}".format( r, g, b)

    return retval

# ----------------------------------  main  ----------------------------------

nodeColor_func = nodeColor_Additive
random.seed()

systems = sys.argv
systems.pop(0)                          # zap program name
n = len(systems)                        # Number of systems

connected = list(range(n))              # Whether system i is connected to the
                                        # cluster yet.

for i in range(n):
    connected[i] = 0

print( '''// Process with GraphViz neato.
graph {
graph [start=1
      ,splines=true
      ,overlap=false
      ,esep="+15"
      ]
node [shape=circle, style=filled]
''')

# Legend
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("All", 4, 4, 4, nodeColor_func(4,4,4)))
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Tech", 4, -4, -4, nodeColor_func(4,-4,-4)))
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Environment", -4, 4, -4, nodeColor_func(-4,4,-4)))
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Resources", -4, -4, 4, nodeColor_func(-4,-4,4)))
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("None", -4, -4, -4, nodeColor_func(-4,-4,-4)))

legendNodes = ["All","Tech","Environment","Resources","None"]
for i in range(len(legendNodes)-1):
    for j in range(i+1, len(legendNodes)):
        print( '{0} -- {1}'.format(legendNodes[i], legendNodes[j]))
print()

# Need to roll for every system but the last two.  2nd-to-last is guaranteed
# to be connected to last, at least.

for i in range(n-2):
    connectedThrow = fudgeThrow()
    # print("\tDEBUG: {0} ({1}): {2}".format(i, systems[i], connectedThrow), file=sys.stderr)
    techThrow = fudgeThrow()            # Technology level
    envThrow = fudgeThrow()             # Environment level
    resThrow = fudgeThrow()             # Resources level
    color = nodeColor_func(techThrow, envThrow, resThrow)
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format(systems[i], techThrow, envThrow, resThrow, color))
    print( "{0} -- {1}".format(systems[i], systems[i+1]))
    j = i + 2
    if (connectedThrow >= 0):
        while ((j < n) and connected[j]):
            j = j+1
        if (j < n):
            print("{0} -- {1}".format(systems[i], systems[j]))
            connected[j] = 1
    if (connectedThrow > 0):
        j = j+1
        while ((j < n) and connected[j]):
            j = j+1
        if (j < n):
            print("{0} -- {1}".format(systems[i], systems[j]))
            connected[j] = 1

# print("\tDEBUG: {0} ({1}): Last".format(n-2, systems[n-2]), file=sys.stderr)

techThrow = fudgeThrow()                
envThrow = fudgeThrow()                 
resThrow = fudgeThrow()                 
color = nodeColor_func(techThrow, envThrow, resThrow)
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format(systems[n-2], techThrow, envThrow, resThrow, color))
print("{0} -- {1}".format(systems[n-2], systems[n-1]))

techThrow = fudgeThrow()                
envThrow = fudgeThrow()                 
resThrow = fudgeThrow()                 
color = nodeColor_func(techThrow, envThrow, resThrow)
print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format(systems[n-1], techThrow, envThrow, resThrow, color))

print( "}")                             # graph
