using Azure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.CodeDom;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics.Eventing.Reader;
using System.IO;
using System.Net;
using System.Security.Policy;
using System.Text.Json;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT + "upload/{siteid}/{tableid}/{recid}")]
    public class FileController : ControllerBase
    {
        //select data in table
        [HttpPost]
        public async Task<ResponseJson> Upload(String siteid, String tableid, String recid)
        {
            try{
                var prefix = "media/" + siteid + "/" + tableid + "/" + recid + "/";
                var path = "wwwroot/"+prefix;
                if (!Directory.Exists(path)) Directory.CreateDirectory(path);
                var formData = await Request.ReadFormAsync();
                var names = new String[formData.Files.Count];
                for (var i = 0; i < formData.Files.Count; i++)
                {
                    var file = formData.Files[i];
                    using (var stream = new FileStream(path + file.Name, FileMode.OpenOrCreate))
                    {
                        file.CopyTo(stream);
                    }
                    names[i] = prefix+file.Name;
                }
                return new ResponseJson { success = true,result=names,total=names.Length};
            } catch (Exception ex) {
                return new ResponseJson { success = false,result=ex.Message };
            }
        }
    }
}
