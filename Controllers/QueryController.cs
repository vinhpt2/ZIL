using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.SqlServer.Management.Common;
using Microsoft.SqlServer.Management.Smo;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel.Design;
using System.Data;
using System.Diagnostics.Eventing.Reader;
using System.Reflection;
using System.Security.Policy;
using System.Text.Json;

namespace SQLRestC.Controllers
{
    [Authorize]
    [ApiController]
    [Route(Global.ROOT + "{database}/{schema}/query")]
    public class QueryController : ControllerBase
    {
        //execute query
        [HttpPost]
        public ResponseJson ExecuteQuery(String database, String schema,ScriptJson sql)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = Global.safeSqlInjection(sql.body);
                    if (response.success)
                    {
                        db.DefaultSchema = schema;
                        using (var ds = db.ExecuteWithResults(sql.body))
                        {
                            var tb = ds.Tables[0];
                            response.total = tb.Rows.Count;
                            response.result = Global.dtable2array(tb, Global.LIMIT);
                        }
                    }
                    else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
        //execute noquery
        [HttpPut]
        public ResponseJson ExecuteNoQuery(String database, String schema, ScriptJson sql)
        {
            Server server = null;
            try
            {
                server = new Server(new ServerConnection(Global.server, Global.username, Global.password));
                var db = server.Databases[database];
                var response = new ResponseJson { success = (db != null) };
                if (response.success)
                {
                    response.success = Global.safeSqlInjection(sql.body);
                    if (response.success)
                    {
                        db.DefaultSchema = schema;
                        db.ExecuteNonQuery(sql.body);
                    }
                    else response.result = "SQL INJECTION FOUND! Not safe to executes.";
                }
                else response.result = "Database '" + database + "' not found!";
                return response;
            }
            catch (Exception ex)
            {
                return new ResponseJson { success = false, result = ex.InnerException == null ? ex.Message : (ex.InnerException.InnerException == null ? ex.InnerException.Message : ex.InnerException.InnerException.Message) };
            }
            finally
            {
                if (server != null) server.ConnectionContext.Disconnect();
            }
        }
    }
}
