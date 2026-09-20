`idram-qr.png` is the Idram QR the payment step shows. It is the export from the
Idram app, cropped to the QR card and saved as PNG: the caption and the ID line
underneath are dropped, because the page prints the ID as text beside the code.

It encodes `#;750794530`, checked after cropping so the scan still reaches the
right account. Replace it the same way if the account ever changes, and confirm
the new file scans before committing.

If the file is missing the gate still works. It drops the picture and shows the
Idram ID on its own, so a customer can pay by ID from inside the app.
