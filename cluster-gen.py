#!/usr/bin/python3
                                        # -*- fill-column: 120 -*-

# Generates a graph of systems for a Diaspora RPG cluster.
#
# Command-line args are system names, separated by spaces.
#
# Exmaple:
#     cluster-gen.py A B C D E F > our-cluster.dot
#     neato -Tpdf -oour-cluster.pdf our-cluster.dot

import argparse
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

def nodeColor_Additive(techThrow, envThrow, resThrow):
    """Returns the background color a node should have, using a fairly simple additive algorithm."""

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

# -------------------------------------------------  class StarSystem  -------------------------------------------------

class StarSystem:
    """A star system."""

    def __init__( self, aName):
        self._name = aName
        self._techLevel = fudgeThrow()
        self._envLevel = fudgeThrow()
        self._resLevel = fudgeThrow()
        
    def getName( self):
        return self._name
    
    def getScore( self):
        """System's "score": sum of tech, env and res levels."""
        return self._techLevel + self._envLevel + self._resLevel

    def getTechLevel( self):
        return self._techLevel

    def setTechLevel( self, aTechLevel):
        self._techLevel = aTechLevel
        
    def getEnvLevel( self):
        return self._envLevel

    def getResLevel( self):
        return self._resLevel

    def toString( self):
        return "{0}: T{1} E{2} R{3}, score= {4}".format(
            self._name, self._techLevel, self._envLevel, self._resLevel, self.getScore())

# -------------------------------------------------------  main  -------------------------------------------------------

nodeColor_func = nodeColor_Additive
random.seed()

argParser = argparse.ArgumentParser(description="Diaspora cluster generator")
argParser.add_argument('--legend', action="store_true", help="Include a legend of colors in the generated graph")
argParser.add_argument('systemNames', nargs=argparse.REMAINDER, help="Unique first letters of star system names")

args = argParser.parse_args()

# systemNames = sys.argv
# systemNames.pop(0)                          # zap program name

systemNames = args.systemNames

n = len(systemNames)                    # Number of systems

connected = list(range(n))              # Whether system i is connected to the cluster yet.

for i in range(n):
    connected[i] = 0

starSystems = []
maxTech = -5                            # Something less than -4
maxScore = -15                          # Something less than 3*(-4)
minScore = 15                           # Something greater than 3*4
for i in range(n):
    starSys = StarSystem( systemNames[i])
    starSystems.append( starSys)
    if (maxTech < starSys.getTechLevel()):
        maxTech = starSys.getTechLevel()
    s = starSys.getScore()
    if (minScore > s):
        minScore = s
    if (maxScore < s):
        maxScore = s

print("\tDEBUG: systems before checking for slipstream guarantee:", file=sys.stderr)
for starSys in starSystems:
    print( "\tDEBUG: {0}".format( starSys.toString()), file=sys.stderr)
    
goodSystems = []
crappySystems = []
if (maxTech < 2):
    # Must fulfill "slipsteam guarantee": at least one system of T2 or better.
    print('\tDEBUG: **** Max tech ({0}) < 2'.format( maxTech), file=sys.stderr)
    for starSys in starSystems:
        s = starSys.getScore()
        if (s == maxScore):
            goodSystems.append( starSys)
        if (s == minScore):
            crappySystems.append( starSys)
    print('\tDEBUG: good systems: {0}'.format( ", ".join(map( lambda s : s.getName(), goodSystems))), file=sys.stderr)
    if (len(goodSystems) == 1):
        selectedGoodSystem = goodSystems[0]
    else:
        selectedGoodSystem = goodSystems[random.randrange(len(goodSystems))]
    print('\tDEBUG: selected good system: {0}'.format( selectedGoodSystem.getName()), file=sys.stderr)
    selectedGoodSystem.setTechLevel( 2)

    print('\tDEBUG: crappy systems: {0}'.format( ", ".join(map( lambda s : s.getName(), crappySystems))), file=sys.stderr)
    if (len(crappySystems) == 1):
        crappySystems[0].setTechLevel( 2)
    else:
        # On the off chance that all the systems have the same score, take the "good" system out of the crappy list.
        goodSystemName = selectedGoodSystem.getName()
        crappySystems = list(filter( lambda s : s.getName() != goodSystemName, crappySystems))
        print('\tDEBUG: crappy systems after filtering out good system (if present): {0}'.format( ", ".join(map( lambda s : s.getName(), crappySystems))), file=sys.stderr)
        crappySystems[random.randrange(len(crappySystems))].setTechLevel( 2)
        
print( '''// Process with GraphViz neato.
graph {
graph [                    // Comma-separated key=value pairs.
      start="random -1",   // Randomize layout.  Rerun to get a different layout.
      splines=true,
      overlap=false,
      esep="+15"
      ]
node [shape=circle, style=filled]
''')

if (args.legend):
    print( '// Legend')
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("All", 4, 4, 4, nodeColor_func(4,4,4)))
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Tech", 4, -4, -4, nodeColor_func(4,-4,-4)))
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Environment", -4, 4, -4, nodeColor_func(-4,4,-4)))
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("Resources", -4, -4, 4, nodeColor_func(-4,-4,4)))
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format("None", -4, -4, -4, nodeColor_func(-4,-4,-4)))

    legendNodes = ["All","Tech","Environment","Resources","None"]
    for i in range(len(legendNodes)-1):
        for j in range(i+1, len(legendNodes)):
            print( '{0} -- {1}'.format(legendNodes[i], legendNodes[j]))
    print( '// Legend ends')
    print()

for starSys in starSystems:
    t = starSys.getTechLevel()
    e = starSys.getEnvLevel()
    r = starSys.getResLevel()
    color = nodeColor_func( t, e, r)
    print( '{0} [label="\\N\\nT{1} E{2} R{3}", fillcolor="{4}"]'.format(starSys.getName(), t, e, r, color))
print()

# Need to roll for every system but the last two.  2nd-to-last is guaranteed
# to be connected to last, at least.

for i in range(n-2):
    connectedThrow = fudgeThrow()
    # print("\tDEBUG: {0} ({1}): {2}".format(i, starSystems[i].getName(), connectedThrow), file=sys.stderr)
    print('\t\t// "Connect" throw from {0}: {1}'.format( starSystems[i].getName(), connectedThrow))
    print( "{0} -- {1}".format(starSystems[i].getName(), starSystems[i+1].getName()))
    j = i + 2
    if (connectedThrow >= 0):
        while ((j < n) and connected[j]):
            j = j+1
        if (j < n):
            print("{0} -- {1}".format(starSystems[i].getName(), starSystems[j].getName()))
            connected[j] = 1
    if (connectedThrow > 0):
        j = j+1
        while ((j < n) and connected[j]):
            j = j+1
        if (j < n):
            print("{0} -- {1}".format(starSystems[i].getName(), starSystems[j].getName()))
            connected[j] = 1

# print("\tDEBUG: {0} ({1}): Last".format(n-2, starSystems[n-2].getName()), file=sys.stderr)

print('\t\t// "Connect" throw from {0}: {1}'.format( starSystems[n-2].getName(), connectedThrow))
print("{0} -- {1}".format(starSystems[n-2].getName(), starSystems[n-1].getName()))

print('\t\t// "Connect" throw from {0}: {1}'.format( starSystems[n-1].getName(), connectedThrow))
print( "}")                             # graph
