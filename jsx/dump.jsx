var cmds = app.getCommands();
var out = "";
for(var i=0; i<cmds.length; i++) {
    if (cmds[i].name && (cmds[i].name.indexOf("Extract") !== -1 || cmds[i].name.indexOf("Delete") !== -1)) {
        out += cmds[i].name + " = " + cmds[i].id + "\n";
    }
}
var f = new File("~/Documents/Adobe_Premiere_Commands.txt");
f.open("w");
f.write(out);
f.close();
