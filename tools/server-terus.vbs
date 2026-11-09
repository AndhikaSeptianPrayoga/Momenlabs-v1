' Menjalankan server-terus.cmd di latar belakang tanpa jendela.
' Sudah berjalan? Tidak dijalankan dua kali (cek port 5174 lebih dulu).
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
folder = fso.GetParentFolderName(WScript.ScriptFullName)
cek = sh.Run("cmd /c netstat -ano | findstr /R /C:"":5174 .*LISTENING"" > nul", 0, True)
If cek <> 0 Then
  sh.Run "cmd /c """ & folder & "\server-terus.cmd""", 0, False
End If
