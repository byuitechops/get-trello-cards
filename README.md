# Trello Grabber

If you need to create a new trello-grabber file, copy it from "VBA Solution Template (WORKING)." Don't ever make changes to an original file in this repo, copy the file first then make your changes. This is, unfortunately, the only good way to deal with this project.

The first thing that happens is you get your key and token from the "settings" sheet. Once it has those, it looks through your "boards" array defined IN the function (future functionality: grab from a column in settings). Then, a series of API calls is made to trello to get the desired data. Data is organized AFTER it is pulled down, then placed into the "data" tab, overwritting old information. Cards that match on an id are overwritten, rows without a matching id are skipped, and new rows are added to the bottom of the document.

The code is commented for your convenience. If you have any questions, please contact Ben Fryar.

See below the macro that "does the work" on the spreadsheet.

```
Sub Update_Trello()

    Dim ApplicationKey As String
    Dim UserToken As String
    Dim JSON As Object, i As Integer, Value As Dictionary, Client As New WebClient, ThisCell As Object, Request As New WebRequest
    Dim boards As Variant
    Dim board As Variant
    
    ApplicationKey = Sheets("settings").Cells(1, 1).Value
    UserToken = Sheets("settings").Cells(2, 1).Value
    
    '''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
    '' BOARDS! TO ADD A BOARD, ADD ANOTHER ELEMENT TO THIS ARRAY
    '' FOLLOWING THE SAME FORMAT, EXAMPLE:
    '' boards = Array("BORARDID", "BORARDID", "BORARDID")
    
        boards = Array("BORARDID", "BORARDID")
    '''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
    For Each board In boards
        Debug.Print board
    Next
     
    Client.BaseUrl = "https://api.trello.com/1/"
    
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
' SET I OUTSIDE OF LOOP SO THAT ALL BOARDS ADD TO THE LAST ROW
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
    i = 1
For Each board In boards
' GET BOARD INFO - SWAP THIS REQUEST WITH "GET CARDS"
  ' Anti-pattern: Building URL by hand
  Request.Resource = "boards/" & board & "?key=" & ApplicationKey & "&token=" & UserToken
  Request.Resource = "boards/{board_id}"
  Request.AddUrlSegment "board_id", board
  Request.AddQuerystringParam "key", ApplicationKey
  Request.AddQuerystringParam "token", UserToken
  Dim Response As WebResponse
  Set Response = Client.Execute(Request)
  'Debug.Print Response.StatusCode & ": " & Response.Content
  
' GET OPEN CARDS
  Request.Resource = "boards/" & board & "/cards/all?key=" & ApplicationKey & "&token=" & UserToken & "&fields=name,url,idMembers,idList,closed"
  Request.Resource = "boards/{board_id}/cards/all"
  Set Response = Client.Execute(Request)
  'Debug.Print Response.StatusCode & ": " & Response.Content
  ' SET I BEFORE LOOP

Set JSON = ParseJson(Response.Content)
' (rowNum, colNum) Output the info for all cards
For Each Value In JSON
Sheets("TrelloData").Cells(i, 1).Value = Value("idBoard")
Sheets("TrelloData").Cells(i, 2).Value = Value("id")
Sheets("TrelloData").Cells(i, 3).Value = Value("closed")
Sheets("TrelloData").Cells(i, 4).Value = Value("idList")
Sheets("TrelloData").Cells(i, 5).Value = Value("name")
Sheets("TrelloData").Cells(i, 6).Value = Value("url")

If Value("idMembers").Count > 0 Then
    Sheets("TrelloData").Cells(i, 7).Value = Join(collectionToArray(Value("idMembers")), " | ")
End If

i = i + 1
Next


' CORRECT BOARD NAME
  Request.Resource = "boards/" & board & "?key=" & ApplicationKey & "&token=" & UserToken
  Request.Resource = "boards/{board_id}"
Set Response = Client.Execute(Request)
Set JSON = ParseJson(Response.Content)
  'Debug.Print Response.StatusCode & ": " & Response.Content
  For Each ThisCell In Sheets("TrelloData").Columns(1).Cells
If ThisCell.Value = JSON("id") Then
ThisCell.Value = JSON("name")
End If
Next
  
' GET LISTS / FIX LIST NAMES
  Request.Resource = "boards/" & board & "/lists?key=" & ApplicationKey & "&token=" & UserToken & "&fields=name"
  Request.Resource = "boards/{board_id}/lists"
  Set Response = Client.Execute(Request)
  'Debug.Print Response.StatusCode & ": " & Response.Content
  
Set JSON = ParseJson(Response.Content)
' Parse JSON for  List IDs, replace List ID's with List Names
For Each Value In JSON
For Each ThisCell In Sheets("TrelloData").Columns(4).Cells
If ThisCell.Value = Value("id") Then
ThisCell.Value = Value("name")
End If
Next
Next



' GET MEMBER NAMES
  Request.Resource = "boards/" & board & "/members?key=" & ApplicationKey & "&token=" & UserToken
  Request.Resource = "boards/{board_id}/members"
  Set Response = Client.Execute(Request)
  Set JSON = ParseJson(Response.Content)
  For Each Value In JSON
For Each ThisCell In Sheets("TrelloData").Columns(7).Cells

If Not IsEmpty(ThisCell.Value) Then
   Dim intCount As Integer
   Dim strArray() As String
   
   strArray = Split(ThisCell.Value, " | ")
   For intCount = LBound(strArray) To UBound(strArray)
   If strArray(intCount) = Value("id") Then
    strArray(intCount) = Value("fullName")
    End If
   Next
   ThisCell.Value = Join(strArray, " | ")
End If
Next
Next

  'Debug.Print Response.StatusCode & ": " & Response.Content
Next



''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
' You have the data, now update the main sheet!
''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''''
Dim tdc As Range
Dim dc As Range
Dim rownum As Integer
 Dim myurl As String
' ONLY ADD A NEW ROW ONCE!
Dim found As Boolean
found = False
For Each tdc In Sheets("TrelloData").UsedRange.Columns("B").Cells
If Not IsEmpty(Sheets("TrelloData").Cells(tdc.Row, 1).Value) Then
    For Each dc In Sheets("Data").UsedRange.Columns("D").Cells
        If tdc.Value = dc.Value Then
            rownum = dc.Row
            Sheets("Data").Cells(rownum, 1).Value = Sheets("TrelloData").Cells(tdc.Row, 5).Value
            Sheets("Data").Cells(rownum, 2).Value = "Y"
            Sheets("Data").Cells(rownum, 3).Value = Sheets("TrelloData").Cells(tdc.Row, 3).Value
            Sheets("Data").Cells(rownum, 4).Value = Sheets("TrelloData").Cells(tdc.Row, 2).Value
            Sheets("Data").Cells(rownum, 5).Value = Sheets("TrelloData").Cells(tdc.Row, 1).Value
            Sheets("Data").Cells(rownum, 6).Value = Sheets("TrelloData").Cells(tdc.Row, 4).Value
            Sheets("Data").Cells(rownum, 7).Value = Sheets("TrelloData").Cells(tdc.Row, 7).Value
            ' SHORTEN THIS TO JUST BE A LINK THAT SAYS "VIEW" WITH THE URL AS A HYPERLINK
           
            Sheets("Data").Cells(rownum, 8).Value = Sheets("TrelloData").Cells(tdc.Row, 6).Value
            ' Tell the bool that it found this row
            found = True
            
        End If
        
    Next dc
    'if the row was not found, do this before moving to the next row
     If found = False Then
        ' FIGURE OUT HOW TO DO THIS AT THE TOP
            Sheets("Data").Cells(3, 1).EntireRow.Insert
            ' ALWAYS THE SAME AS THE FIRST NUMBER IN .Cells(x, 1)
            rownum = 3
            Sheets("Data").Cells(rownum, 1).Value = Sheets("TrelloData").Cells(tdc.Row, 5).Value
            Sheets("Data").Cells(rownum, 2).Value = "Y"
            Sheets("Data").Cells(rownum, 3).Value = Sheets("TrelloData").Cells(tdc.Row, 3).Value
            Sheets("Data").Cells(rownum, 4).Value = Sheets("TrelloData").Cells(tdc.Row, 2).Value
            Sheets("Data").Cells(rownum, 5).Value = Sheets("TrelloData").Cells(tdc.Row, 1).Value
            Sheets("Data").Cells(rownum, 6).Value = Sheets("TrelloData").Cells(tdc.Row, 4).Value
            Sheets("Data").Cells(rownum, 7).Value = Sheets("TrelloData").Cells(tdc.Row, 7).Value
            ' SHORTEN THIS TO JUST BE A LINK THAT SAYS "VIEW" WITH THE URL AS A HYPERLINK
              
            Sheets("Data").Cells(rownum, 8).Value = Sheets("TrelloData").Cells(tdc.Row, 6).Value
        
    End If
    ' RESET FOUND before starting next row
    
    found = False
    End If
Next tdc


End Sub

Function collectionToArray(c As Collection) As Variant()
    Dim a() As Variant: ReDim a(0 To c.Count - 1)
    Dim i As Integer
    For i = 1 To c.Count
        a(i - 1) = c.Item(i)
    Next
    collectionToArray = a
End Function
```



